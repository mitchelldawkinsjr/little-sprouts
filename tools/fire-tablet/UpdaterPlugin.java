package org.littlesprouts.learning;

import android.Manifest;
import android.content.Intent;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "SproutsUpdater")
public class UpdaterPlugin extends Plugin {
  private final ExecutorService io = Executors.newSingleThreadExecutor();
  private static final String RELEASES = "https://api.github.com/repos/mitchelldawkinsjr/little-sprouts/releases/latest";
  private static final String ASSET = "little-sprouts-fire-hd8-release.apk";
  private boolean onWifi() {
    ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
    if (cm == null) return false;
    NetworkCapabilities nc = cm.getNetworkCapabilities(cm.getActiveNetwork());
    return nc != null && nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
        && nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
  }
  @PluginMethod public void check(PluginCall call) {
    io.execute(() -> {
      if (!onWifi()) { JSObject out = new JSObject(); out.put("wifi", false); call.resolve(out); return; }
      try {
        HttpURLConnection conn = (HttpURLConnection) new URL(RELEASES).openConnection();
        conn.setConnectTimeout(10000); conn.setReadTimeout(10000);
        conn.setRequestProperty("Accept", "application/vnd.github+json");
        conn.setRequestProperty("User-Agent", "LittleSprouts-FireTablet");
        try {
          int status = conn.getResponseCode();
          if (status == 404) {
            JSObject out = new JSObject();
            out.put("wifi", true);
            out.put("available", false);
            out.put("noRelease", true);
            call.resolve(out);
            return;
          }
          if (status != 200) throw new Exception("Release check HTTP " + status);
          String body = new String(conn.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
          org.json.JSONObject release = new org.json.JSONObject(body);
          String tag = release.getString("tag_name");
          String current = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0).versionName;
          org.json.JSONArray assets = release.getJSONArray("assets");
          String url = null; String digest = null;
          for (int i=0;i<assets.length();i++) {
            org.json.JSONObject a=assets.getJSONObject(i);
            if (ASSET.equals(a.getString("name"))) { url=a.getString("browser_download_url"); digest=a.optString("digest", ""); }
          }
          JSObject out = new JSObject(); out.put("wifi", true); out.put("version", tag);
          out.put("current", current); out.put("available", url != null && !tag.equals(current));
          if (url != null) { out.put("url", url); out.put("digest", digest); }
          call.resolve(out);
        } finally { conn.disconnect(); }
      } catch(Exception e) { call.reject("Update check failed: " + e.getMessage()); }
    });
  }
  @PluginMethod public void install(PluginCall call) {
    String url = call.getString("url");
    String digest = call.getString("digest");
    if (url == null || !url.startsWith("https://github.com/mitchelldawkinsjr/little-sprouts/releases/download/")) {
      call.reject("Untrusted APK URL"); return;
    }
    io.execute(() -> {
      if (!onWifi()) { call.reject("Wi-Fi required"); return; }
      try {
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setConnectTimeout(15000); conn.setReadTimeout(30000);
        conn.setInstanceFollowRedirects(true);
        File apk = new File(getContext().getCacheDir(), "little-sprouts-update.apk");
        try (InputStream in = conn.getInputStream(); FileOutputStream out = new FileOutputStream(apk)) {
          if (conn.getResponseCode() != 200) throw new Exception("Download HTTP " + conn.getResponseCode());
          byte[] buf = new byte[65536]; int n; long bytes = 0;
          while ((n=in.read(buf)) != -1) {
            if (!onWifi()) throw new Exception("Wi-Fi disconnected");
            bytes += n; if (bytes > 350L * 1024 * 1024) throw new Exception("APK exceeds size limit");
            out.write(buf,0,n);
          }
          if (bytes < 10000) throw new Exception("Incomplete APK");
        } finally { conn.disconnect(); }
        if (digest == null || !digest.matches("sha256:[a-fA-F0-9]{64}")) throw new Exception("Missing trusted SHA-256 digest");
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        try (InputStream input = new java.io.FileInputStream(apk)) { byte[] b = new byte[65536]; int n; while ((n=input.read(b))!=-1) sha.update(b,0,n); }
        StringBuilder hex = new StringBuilder(); for(byte b:sha.digest()) hex.append(String.format("%02x",b & 255));
        if (!digest.substring(7).equalsIgnoreCase(hex.toString())) throw new Exception("APK checksum mismatch");
        android.content.pm.PackageInfo info = getContext().getPackageManager().getPackageArchiveInfo(apk.getAbsolutePath(), 0);
        if (info == null || !getContext().getPackageName().equals(info.packageName)) throw new Exception("Unexpected APK package");
        Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName()+".updates", apk);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
      } catch(Exception e) { call.reject("Update download failed: " + e.getMessage()); }
    });
  }
}
