package org.littlesprouts.learning;

public class UpdatePolicyTest {
  private static void expect(boolean result) { if (!result) throw new AssertionError(); }
  public static void main(String[] args) {
    expect(UpdatePolicy.versionCode("1.0.0") == 1000001);
    expect(UpdatePolicy.versionCode("v1.0.1") == 1000002);
    expect(UpdatePolicy.versionCode("1.10.0") > UpdatePolicy.versionCode("1.9.99"));
    for (String v : new String[]{"1", "1.0", "01.0.0", "1.0.0-beta", "1.0.1000", "99999999999999999999.0.0", "2100.0.0"})
      expect(UpdatePolicy.versionCode(v) == -1);
    expect(UpdatePolicy.trustedDigest("sha256:" + "ab".repeat(32)));
    expect(!UpdatePolicy.trustedDigest(""));
    expect(!UpdatePolicy.trustedDigest("sha256:abc"));
    String url = "https://github.com/mitchelldawkinsjr/little-sprouts/releases/download/1.0.0/" + UpdatePolicy.ASSET;
    expect(UpdatePolicy.trustedUrl(url));
    expect(!UpdatePolicy.trustedUrl(url + "?redirect=bad"));
    expect(!UpdatePolicy.trustedUrl(url.replace("github.com/", "github.com.evil/")));
    expect(!UpdatePolicy.trustedUrl(url.replace("https:", "http:")));
    expect(!UpdatePolicy.trustedUrl(url.replace(UpdatePolicy.ASSET, "other.apk")));
    System.out.println("Updater version, URL, and checksum policy checks passed");
  }
}
