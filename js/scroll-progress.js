document.addEventListener('DOMContentLoaded', () => {
  // Create progress bar elements
  const container = document.createElement('div');
  container.id = 'scroll-progress-container';
  
  const bar = document.createElement('div');
  bar.id = 'scroll-progress-bar';
  
  container.appendChild(bar);
  document.body.prepend(container);

  // Update progress bar on scroll
  const updateProgress = () => {
    // Calculate how far down the page the user has scrolled
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

    // Calculate percentage (guard against divide-by-zero on short pages)
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

    // Apply width to bar
    bar.style.width = progress + '%';
  };

  // Batch to one update per animation frame instead of running on every raw
  // scroll event, which fires far faster than the screen can repaint and
  // was causing visible scroll jank.
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Initial call in case page is loaded halfway down
  updateProgress();
});
