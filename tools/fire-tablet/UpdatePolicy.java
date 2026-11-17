package org.littlesprouts.learning;

/** Pure policy shared by the native updater and its JVM tests. */
public final class UpdatePolicy {
  public static final String PACKAGE = "org.littlesprouts.learning";
  public static final String ASSET = "little-sprouts-fire-hd8-release.apk";
  private static final String PREFIX = "https://github.com/mitchelldawkinsjr/little-sprouts/releases/download/";

  public static long versionCode(String version) {
    if (version == null) return -1;
    if (version.startsWith("v")) version = version.substring(1);
    if (!version.matches("(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)")) return -1;
    try {
      String[] p = version.split("\\.");
      long major = Long.parseLong(p[0]), minor = Long.parseLong(p[1]), patch = Long.parseLong(p[2]);
      if (major > 2100 || minor > 999 || patch > 999) return -1;
      long code = major * 1000000 + minor * 1000 + patch + 1;
      return code <= 2100000000L ? code : -1;
    } catch (NumberFormatException e) { return -1; }
  }

  public static boolean trustedDigest(String digest) {
    return digest != null && digest.matches("sha256:[a-fA-F0-9]{64}");
  }

  public static boolean trustedUrl(String url) {
    if (url == null || !url.startsWith(PREFIX)) return false;
    try {
      java.net.URI uri = new java.net.URI(url);
      String suffix = url.substring(PREFIX.length());
      return uri.getQuery() == null && uri.getFragment() == null
          && suffix.matches("v?[0-9]+\\.[0-9]+\\.[0-9]+/" + ASSET.replace(".", "\\."));
    } catch (java.net.URISyntaxException e) { return false; }
  }
}
