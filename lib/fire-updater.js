// Capacitor-only update UI. No update request is made in normal browsers.
const bridge = window.Capacitor?.Plugins?.SproutsUpdater;
if (bridge) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Check for app updates';
  button.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:9999;padding:12px;border-radius:12px;background:#264b3c;color:white;border:2px solid white';
  const check = async (automatic = false) => {
    try {
      const state = await bridge.check();
      if (!state.wifi) { if (!automatic) alert('Connect to Wi-Fi to check for updates.'); return; }
      if (!state.available) { if (!automatic) alert('Little Sprouts is up to date.'); return; }
      if (confirm('Little Sprouts ' + state.version + ' is available. Download on Wi-Fi and open the Android installer?')) {
        button.disabled = true;
        button.textContent = 'Downloading update…';
        try { await bridge.install({ url: state.url, digest: state.digest }); }
        finally { button.disabled = false; button.textContent = 'Check for app updates'; }
      }
    } catch (error) { if (!automatic) alert('Update check failed: ' + (error.message || error)); }
  };
  button.addEventListener('click', () => check(false));
  document.body.append(button);
  // On launch; also check after returning to the app on Wi-Fi.
  setTimeout(() => check(true), 6000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(true); });
}
