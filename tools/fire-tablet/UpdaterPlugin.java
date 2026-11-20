package org.littlesprouts.learning;

import android.content.Intent;
import android.content.ClipData;
import android.content.ActivityNotFoundException;
import android.content.pm.ResolveInfo;
import android.os.ParcelFileDescriptor;
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
import java.util.List;

@CapacitorPlugin(name = "SproutsUpdater")
public class UpdaterPlugin extends Plugin {
  private final ExecutorService io = Executors.newSingleThreadExecutor();
  private static final String RELEASES = "https://api.github.com/repos/mitchelldawkinsjr/little-sprouts/releases/latest";
  private static final String ASSET = UpdatePolicy.ASSET;
  private static final String APK_MIME = "application/vnd.android.package-archive";
  private File pendingApk() {
    // Android may clear cache/ at any time. Keep the verified APK in private files/
    // until the installer has finished reading it, especially on low-storage tablets.
    return new File(new File(getContext().getFilesDir(), "updates"), "little-sprouts-update.apk");
  }
  private void cleanupInstalledUpdate() {
    File apk = pendingApk();
    if (!apk.isFile()) return;
    try {
      android.content.pm.PackageManager pm = getContext().getPackageManager();
      android.content.pm.PackageInfo archived = pm.getPackageArchiveInfo(apk.getAbsolutePath(), 0);
      android.content.pm.PackageInfo installed = pm.getPackageInfo(getContext().getPackageName(), 0);
      if (archived == null || code(archived) <= code(installed)) apk.delete();
    } catch (Exception ignored) {
      // A failed cleanup must never interfere with checking for an update.
    }
  }
  private void launchInstaller(File apk) throws Exception {
    // Fire OS must stage another copy while updating. Report a useful storage
    // error before the system installer turns it into an ambiguous parse error.
    long requiredFree = apk.length() + 64L * 1024 * 1024;
    if (apk.getParentFile().getUsableSpace() < requiredFree)
      throw new Exception("Not enough internal storage to install the update; free up at least 1 GB and retry");
    Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName()+".fileprovider", apk);
    // Prove that the provider can serve the same verified bytes before handing
    // it to Fire OS's installer; mismatches are actionable here, not a parse popup.
    try (ParcelFileDescriptor descriptor = getContext().getContentResolver().openFileDescriptor(uri, "r")) {
      if (descriptor == null || (descriptor.getStatSize() >= 0 && descriptor.getStatSize() != apk.length()))
        throw new Exception("The verified update cannot be read through FileProvider");
    }

    Intent install = new Intent(Intent.ACTION_INSTALL_PACKAGE);
    install.setDataAndType(uri, APK_MIME);
    install.setClipData(ClipData.newRawUri("Little Sprouts APK update", uri));
    install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);

    // Some Fire OS installers hand off to a second activity. Give the resolved
    // installer package direct permission as well as the temporary intent grant.
    List<ResolveInfo> handlers = getContext().getPackageManager().queryIntentActivities(
        install, android.content.pm.PackageManager.MATCH_DEFAULT_ONLY);
    for (ResolveInfo handler : handlers) {
      if (handler.activityInfo != null)
        getContext().grantUriPermission(handler.activityInfo.packageName, uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
    }
    try {
      getContext().startActivity(install);
    } catch (ActivityNotFoundException missing) {
      // Older/modified Fire OS builds may only support VIEW with the APK MIME.
      install.setAction(Intent.ACTION_VIEW);
      getContext().startActivity(install);
    }
  }
  private static long code(android.content.pm.PackageInfo info) {
    return Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode;
  }
  private static java.util.Set<String> signers(android.content.pm.PackageInfo info) {
    android.content.pm.Signature[] signatures = Build.VERSION.SDK_INT >= 28
        ? (info.signingInfo == null ? null : info.signingInfo.getApkContentsSigners()) : info.signatures;
    java.util.Set<String> out = new java.util.HashSet<>();
    if (signatures != null) for (android.content.pm.Signature signature : signatures) out.add(signature.toCharsString());
    return out;
  }
  private boolean onWifi() {
    ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
    if (cm == null) return false;
    NetworkCapabilities nc = cm.getNetworkCapabilities(cm.getActiveNetwork());
    return nc != null && nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
        && nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
  }
  @PluginMethod public void check(PluginCall call) {
    io.execute(() -> {
      cleanupInstalledUpdate();
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
          java.io.ByteArrayOutputStream data = new java.io.ByteArrayOutputStream();
          try (InputStream input = conn.getInputStream()) {
            byte[] buffer = new byte[8192]; int count;
            while ((count = input.read(buffer)) != -1) {
              if (data.size() + count > 2 * 1024 * 1024) throw new Exception("Release response too large");
              data.write(buffer, 0, count);
            }
          }
          String body = new String(data.toByteArray(), java.nio.charset.StandardCharsets.UTF_8);
          org.json.JSONObject release = new org.json.JSONObject(body);
          String tag = release.getString("tag_name");
          android.content.pm.PackageInfo installed = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
          String current = installed.versionName;
          org.json.JSONArray assets = release.getJSONArray("assets");
          String url = null; String digest = null;
          for (int i=0;i<assets.length();i++) {
            org.json.JSONObject a=assets.getJSONObject(i);
            if (ASSET.equals(a.getString("name"))) { url=a.getString("browser_download_url"); digest=a.optString("digest", ""); }
          }
          JSObject out = new JSObject(); out.put("wifi", true); out.put("version", tag);
          boolean available = !release.optBoolean("draft") && !release.optBoolean("prerelease")
              && UpdatePolicy.versionCode(tag) > code(installed)
              && UpdatePolicy.trustedUrl(url) && UpdatePolicy.trustedDigest(digest);
          out.put("current", current); out.put("available", available);
          if (url != null) { out.put("url", url); out.put("digest", digest); }
          call.resolve(out);
        } finally { conn.disconnect(); }
      } catch(Exception e) { call.reject("Update check failed: " + e.getMessage()); }
    });
  }
  @PluginMethod public void install(PluginCall call) {
    String url = call.getString("url");
    String digest = call.getString("digest");
    if (!UpdatePolicy.trustedUrl(url)) {
      call.reject("Untrusted APK URL"); return;
    }
    if (!UpdatePolicy.trustedDigest(digest)) { call.reject("Missing trusted SHA-256 digest"); return; }
    io.execute(() -> {
      if (!onWifi()) { call.reject("Wi-Fi required"); return; }
      File apk = pendingApk();
      File directory = apk.getParentFile();
      try {
        if (!directory.isDirectory() && !directory.mkdirs()) throw new Exception("Cannot create update cache");
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setConnectTimeout(15000); conn.setReadTimeout(30000);
        conn.setInstanceFollowRedirects(true);
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
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        try (InputStream input = new java.io.FileInputStream(apk)) { byte[] b = new byte[65536]; int n; while ((n=input.read(b))!=-1) sha.update(b,0,n); }
        StringBuilder hex = new StringBuilder(); for(byte b:sha.digest()) hex.append(String.format("%02x",b & 255));
        if (!digest.substring(7).equalsIgnoreCase(hex.toString())) throw new Exception("APK checksum mismatch");
        android.content.pm.PackageManager pm = getContext().getPackageManager();
        int flags = Build.VERSION.SDK_INT >= 28 ? android.content.pm.PackageManager.GET_SIGNING_CERTIFICATES : android.content.pm.PackageManager.GET_SIGNATURES;
        android.content.pm.PackageInfo info = pm.getPackageArchiveInfo(apk.getAbsolutePath(), flags);
        if (info == null || !getContext().getPackageName().equals(info.packageName)) throw new Exception("Unexpected APK package");
        android.content.pm.PackageInfo installed = pm.getPackageInfo(getContext().getPackageName(), flags);
        if (code(info) <= code(installed)) throw new Exception("APK is not a newer version");
        if (signers(info).isEmpty() || !signers(info).equals(signers(installed))) throw new Exception("APK signing certificate differs from the installed app; a one-time manual reinstall is required");
        if (!onWifi()) throw new Exception("Wi-Fi disconnected");
        if (Build.VERSION.SDK_INT >= 26 && !pm.canRequestPackageInstalls()) {
          Intent settings = new Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
              Uri.parse("package:" + getContext().getPackageName()));
          settings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
          getContext().startActivity(settings);
          throw new Exception("Allow Little Sprouts to install unknown apps, then retry the update");
        }
        launchInstaller(apk);
        call.resolve();
      } catch(Exception e) {
        apk.delete();
        call.reject("Update installation could not start: " + e.getMessage());
      }
    });
  }
}
