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
    
    // Calculate percentage
    const progress = (scrollTop / scrollHeight) * 100;
    
    // Apply width to bar
    bar.style.width = progress + '%';
  };

  // Listen for scroll events (using passive for performance)
  window.addEventListener('scroll', updateProgress, { passive: true });
  
  // Initial call in case page is loaded halfway down
  updateProgress();
});
