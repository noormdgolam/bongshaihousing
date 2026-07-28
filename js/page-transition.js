document.addEventListener('DOMContentLoaded', () => {
  // Fade in on load
  setTimeout(() => {
    document.body.classList.add('page-loaded');
  }, 50);

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
