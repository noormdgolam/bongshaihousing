document.addEventListener('DOMContentLoaded', () => {
  // Fade in on load
  setTimeout(() => {
    document.body.classList.add('page-loaded');
  }, 50);

  // Restore visibility when the page is served from the browser's
  // back/forward cache (e.g. user clicks Back). bfcache restores don't
  // fire DOMContentLoaded again, so without this the page stays stuck
  // at opacity: 0 (the page-exit state set right before the user
  // navigated away) until a manual refresh.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      document.body.classList.remove('page-exit');
      document.body.classList.add('page-loaded');
      // Also release any scroll lock left over from an overlay (search
      // modal, mobile drawer, lightbox) that was open when the user
      // navigated away - bfcache restores that state exactly as it was,
      // so without this the restored page can come back unscrollable.
      document.body.style.overflow = '';
    }
  });

  // Intercept clicks on internal links
  const links = document.querySelectorAll('a[href]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetUrl = link.getAttribute('href');
      
      // Don't intercept external links, anchors, or target="_blank"
      if (
        targetUrl.startsWith('http') ||
        targetUrl.startsWith('mailto:') ||
        targetUrl.startsWith('tel:') ||
        targetUrl.startsWith('#') ||
        link.getAttribute('target') === '_blank' ||
        e.ctrlKey || 
        e.metaKey
      ) {
        return;
      }

      // It's an internal link, intercept it
      e.preventDefault();
      
      // Trigger fade out
      document.body.classList.add('page-exit');
      document.body.classList.remove('page-loaded');
      
      // Wait for transition (0.4s) then navigate
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 400); // 400ms matches the CSS transition time
    });
  });
});
