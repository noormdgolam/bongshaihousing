// Captures utm_source/utm_medium/utm_campaign/gclid/fbclid from the landing
// URL into a first-party cookie (30 days), so a form filled out several pages
// (and possibly several days) after a visitor clicked an ad still knows which
// campaign brought them - this is how ad spend gets attributed back to leads.
//
// Last-touch model, kept deliberately simple: if the current URL carries any
// campaign params, they replace whatever was stored before. If it doesn't
// (someone just browsing the site normally), the existing cookie is left
// alone rather than being cleared - a visitor who arrived from a Facebook ad
// and then clicks around the site shouldn't lose that attribution just
// because the second page has a clean URL.
(function () {
  var COOKIE_NAME = 'bh_utm';
  var COOKIE_DAYS = 30;
  var FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid'];

  function readCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    if (!match) return null;
    try { return JSON.parse(decodeURIComponent(match[1])); } catch (e) { return null; }
  }

  function writeCookie(name, valueObj, days) {
    var expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(JSON.stringify(valueObj)) +
      '; expires=' + expires + '; path=/; SameSite=Lax';
  }

  function captureFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var found = {};
    var hasAny = false;
    FIELDS.forEach(function (key) {
      var val = params.get(key);
      if (val) { found[key] = val; hasAny = true; }
    });
    if (hasAny) writeCookie(COOKIE_NAME, found, COOKIE_DAYS);
  }

  captureFromUrl();

  window.BHUtm = {
    get: function () { return readCookie(COOKIE_NAME) || {}; },
    // utm_source, or the ad-network click id as a fallback when a link was
    // clicked straight through without a utm_source param, or 'direct' when
    // there's no campaign signal at all - this is exactly the value that
    // becomes "কোথা থেকে এসেছে" on the lead record.
    source: function () {
      var v = this.get();
      return v.utm_source || (v.gclid ? 'google-ads' : null) || (v.fbclid ? 'facebook' : null) || 'direct';
    },
  };
})();
