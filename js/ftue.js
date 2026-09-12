// ftue.js — first-visit offer.
//
// This used to fire one second after DOMContentLoaded, which put a full-screen
// branding panel over the page before the visitor had seen anything. On mobile
// that is the pattern Google calls an intrusive interstitial and demotes in
// search, and it interrupted without asking for anything, so it cost ranking
// and captured nothing.
//
// It now waits for a signal of interest — half the page scrolled, or the
// pointer leaving toward the tab bar on desktop — and asks for a name and
// number, which go to /api/leads (the same validated, rate-limited, deduping
// path the contact form uses). Shown once per visitor either way.
document.addEventListener('DOMContentLoaded', () => {
  const FTUE_KEY = 'bongshai_visited';
  const modal = document.getElementById('ftue-modal');
  if (!modal) return;

  let seen = false;
  try { seen = !!localStorage.getItem(FTUE_KEY); } catch (e) { /* private mode: treat as unseen */ }
  if (seen) return;

  const form = document.getElementById('ftueForm');
  const nameEl = document.getElementById('ftueName');
  const phoneEl = document.getElementById('ftuePhone');
  const errEl = document.getElementById('ftueErr');
  const okEl = document.getElementById('ftueOk');
  const submitEl = document.getElementById('ftueSubmit');

  let shown = false;

  function markSeen() {
    try { localStorage.setItem(FTUE_KEY, 'true'); } catch (e) { /* nothing to do */ }
  }

  function open() {
    if (shown) return;
    shown = true;
    modal.classList.add('active');
    markSeen();
    teardown();
    // Focus the first field so a keyboard or screen-reader user lands inside
    // the dialog rather than behind it.
    if (nameEl) setTimeout(() => nameEl.focus(), 120);
  }

  function close() {
    modal.classList.remove('active');
    markSeen();
    teardown();
  }

  // ---- triggers: interest, not arrival ----
  function onScroll() {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    if ((window.scrollY || doc.scrollTop) / scrollable >= 0.5) open();
  }

  function onExit(e) {
    // Desktop only: pointer leaving through the top of the viewport.
    if (e.clientY <= 0) open();
  }

  function teardown() {
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('mouseout', onExit);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  if (!window.matchMedia('(hover: none)').matches) {
    document.addEventListener('mouseout', onExit);
  }

  // ---- dismissal ----
  const closeBtn = modal.querySelector('.ftue-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) close();
  });
  const skip = modal.querySelector('.ftue-skip a');
  if (skip) skip.addEventListener('click', markSeen);

  // ---- submission ----
  // Mirrors lib/leads.js isValidBdPhone so a wrong number is caught here
  // rather than after a round trip.
  function normalisePhone(raw) {
    let d = String(raw || '').replace(/\D/g, '');
    if (d.indexOf('880') === 0) d = '0' + d.slice(3);
    else if (d.length === 10 && d.charAt(0) !== '0') d = '0' + d;
    return /^01[3-9]\d{8}$/.test(d) ? d : null;
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (nameEl.value || '').trim();
      const phone = (phoneEl.value || '').trim();
      const fail = (msg) => { errEl.textContent = msg; errEl.hidden = false; };

      if (name.length < 2) return fail('আপনার নাম লিখুন / Please enter your name.');
      if (!normalisePhone(phone)) return fail('সঠিক মোবাইল নম্বর দিন / Enter a valid mobile number.');
      errEl.hidden = true;

      submitEl.disabled = true;
      submitEl.textContent = 'পাঠানো হচ্ছে… / Sending…';
      try {
        await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, source: 'homepage_offer', site: location.hostname.replace(/^www\./, '') }),
        });
      } catch (err) {
        // The visitor is not the right person to show a network error to, and
        // the server logs a fallback anyway. Thank them and move on.
      }
      form.hidden = true;
      okEl.hidden = false;
      setTimeout(close, 2600);
    });
  }
});
