// Imported only by the informational parent/educator page. No Google scripts by default.
const KEY = 'sprouts-parent-ga4';
const button = document.getElementById('gaConsent');
const status = document.getElementById('gaStatus');
let measurementId = '';
let enabled = false;
let installed = false;
let sent = false;
let referrer = '';
try {
  const previous = new URL(document.referrer);
  if (previous.origin !== location.origin && /^https?:$/.test(previous.protocol)) referrer = previous.origin + '/';
} catch { /* no external referrer */ }
try { enabled = localStorage.getItem(KEY) === 'yes'; } catch { /* not saved */ }

function paint() {
  button.setAttribute('aria-pressed', String(enabled));
  button.textContent = enabled ? 'Turn off analytics' : 'Allow analytics here';
  status.textContent = enabled ? 'Analytics allowed on this page.' : 'Analytics off.';
}

function start() {
  if (!enabled || !measurementId || !navigator.onLine) return;
  window[`ga-disable-${measurementId}`] = false;
  if (!installed) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
      cookie_prefix: 'sprouts_parents', cookie_path: '/for-parents/',
      page_location: `${location.origin}/for-parents/`, page_referrer: referrer
    });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    tag.onerror = () => { status.textContent = 'Analytics could not connect. Little Sprouts still works.'; };
    document.head.append(tag);
    installed = true;
  }
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
  if (!sent) {
    window.gtag('event', 'page_view', {
      send_to: measurementId,
      page_location: `${location.origin}/for-parents/`,
      page_referrer: referrer,
      page_title: 'Little Sprouts for parents and educators'
    });
    sent = true;
  }
}

button.addEventListener('click', () => {
  enabled = !enabled;
  try { localStorage.setItem(KEY, enabled ? 'yes' : 'no'); } catch { /* this visit only */ }
  paint();
  if (enabled) start();
  else if (installed) {
    window[`ga-disable-${measurementId}`] = true;
    window.gtag('consent', 'update', { analytics_storage: 'denied' });
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.trim().split('=')[0];
      if (!/^sprouts_parents_ga(?:_[A-Z0-9]+)?$/i.test(name)) continue;
      document.cookie = `${name}=; Max-Age=0; Path=/for-parents/`;
      const labels = location.hostname.split('.');
      while (labels.length > 1) {
        document.cookie = `${name}=; Max-Age=0; Path=/for-parents/; Domain=${labels.join('.')}`;
        labels.shift();
      }
    }
  }
});
window.addEventListener('online', start);
window.addEventListener('storage', event => {
  if (event.key !== KEY && event.key !== null) return;
  enabled = event.newValue === 'yes';
  if (measurementId) window[`ga-disable-${measurementId}`] = !enabled;
  paint();
  if (enabled) start();
});
try {
  const res = await fetch('/for-parents/analytics.json', { cache: 'no-store' });
  const config = res.ok && await res.json();
  if (/^G-[A-Z0-9]{4,20}$/.test(config?.measurementId || '')) {
    measurementId = config.measurementId;
    document.getElementById('measurement').hidden = false;
    paint();
    start();
  }
} catch { /* site still works without analytics */ }
