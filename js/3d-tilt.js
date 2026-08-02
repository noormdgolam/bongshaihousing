document.addEventListener('DOMContentLoaded', () => {
  const tiltElements = document.querySelectorAll('[data-tilt]');

  tiltElements.forEach(el => {
    // Basic CSS for the 3D effect
    el.style.transformStyle = 'preserve-3d';
    el.style.willChange = 'transform';
    // We add a subtle transition for returning to rest and smooth tracking
    el.style.transition = 'transform 0.1s ease-out';

    let bounds;
    let maxTilt = 5; // Maximum rotation in degrees

    el.addEventListener('mouseenter', () => {
      bounds = el.getBoundingClientRect();
      el.style.transition = 'transform 0.1s ease-out';
    });

    el.addEventListener('mousemove', (e) => {
      if (!bounds) bounds = el.getBoundingClientRect();
      
      const mouseX = e.clientX - bounds.left;
      const mouseY = e.clientY - bounds.top;

      const centerX = bounds.width / 2;
      const centerY = bounds.height / 2;

      // Calculate rotation based on cursor distance from center
      const rotateX = ((mouseY - centerY) / centerY) * -maxTilt;
      const rotateY = ((mouseX - centerX) / centerX) * maxTilt;

      // Add a slight scale for the magnetic pop effect
      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    el.addEventListener('mouseleave', () => {
      // Smoothly return to original state
      el.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
      el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      bounds = null;
    });
  });
});
