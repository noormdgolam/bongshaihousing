// mobile-disclosure.js — collapses long reading sections on phones.
//
// Two sections dominate the mobile homepage: the FAQ (1,135px, four answers
// nobody has asked for yet) and the About copy (1,265px of prose). Both are
// worth keeping — they answer real questions and they carry the SEO text — but
// on a 390px screen they push everything below them out of reach.
//
// So they collapse rather than disappear. Every word stays in the DOM: this is
// user-initiated disclosure, the same as a <details> element, not hidden text.
// Desktop is untouched.
(function () {
  var MOBILE = '(max-width: 640px)';
  var applied = false;

  function isPhone() {
    return window.matchMedia && window.matchMedia(MOBILE).matches;
  }

  // ---- FAQ: each question becomes a real disclosure button ----------------
  function buildFaq() {
    var items = document.querySelectorAll('.faq-grid > article');
    if (!items.length) return;

    Array.prototype.forEach.call(items, function (item, i) {
      if (item.getAttribute('data-disclosure')) return;
      var q = item.querySelector('h3');
      var a = item.querySelector('p');
      if (!q || !a) return;

      var id = 'faq-a-' + i;
      a.id = id;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'md-toggle';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', id);
      // Move the question text into the button so the whole row is the target,
      // and keep the h3 as the heading for outline and search purposes.
      btn.innerHTML = q.innerHTML + '<span class="md-chev" aria-hidden="true"></span>';
      q.innerHTML = '';
      q.appendChild(btn);

      a.hidden = true;
      item.setAttribute('data-disclosure', 'faq');

      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        a.hidden = open;
      });
    });
  }

  // ---- About: clamp the prose behind a read-more --------------------------
  function buildAbout() {
    var box = document.querySelector('.about-content');
    if (!box || box.getAttribute('data-disclosure')) return;

    // Only worth clamping if there is materially more than a screenful.
    if (box.getBoundingClientRect().height < 700) return;

    box.classList.add('md-clamp');
    box.setAttribute('data-disclosure', 'about');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'md-more';
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'আরও পড়ুন / Read more';
    box.parentNode.insertBefore(btn, box.nextSibling);

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      box.classList.toggle('md-clamp', open);
      btn.textContent = open ? 'আরও পড়ুন / Read more' : 'কম দেখুন / Show less';
      if (open) box.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }

  function apply() {
    if (!isPhone() || applied) return;
    applied = true;
    buildFaq();
    buildAbout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
  // A phone rotated into landscape can cross the breakpoint; build then too.
  window.addEventListener('resize', apply, { passive: true });
})();
