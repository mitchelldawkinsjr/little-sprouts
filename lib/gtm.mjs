// Google Tag Manager for anonymous visit and game counts (COPPA "internal operations" use only).
// Never push names, grades, answers or anything about a learner: only page views and game ids.
const ID = 'GTM-55XZ4GQX';
const dataLayer = window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
// GA's first-party analytics cookie is allowed so counts show in reports; every ad signal stays off.
gtag('consent', 'default', {
  analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
});
gtag('set', 'ads_data_redaction', true);
dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
if (navigator.onLine) {
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtm.js?id=${ID}`;
  document.head.append(tag);
}

/** `game_start` with the game id, e.g. 'blocks'. In GTM: Custom Event trigger + Data Layer Variable `game_id`. */
export function trackGame(id) {
  if (typeof id === 'string' && /^[a-z0-9-]{1,40}$/.test(id)) dataLayer.push({ event: 'game_start', game_id: id });
}
