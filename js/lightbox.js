document.addEventListener('DOMContentLoaded', () => {
  // 1. Inject Glassmorphism CSS for the Lightbox
  const style = document.createElement('style');
  style.id = 'glass-lightbox-styles';
  style.textContent = `
    .glass-lightbox-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1), visibility 0.4s;
    }
    .glass-lightbox-overlay.active {
      opacity: 1;
      visibility: visible;
    }
    .glass-lightbox-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      transform: scale(0.95) translateY(20px);
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .glass-lightbox-overlay.active .glass-lightbox-content {
      transform: scale(1) translateY(0);
    }
    .glass-lightbox-img {
      max-width: 100%;
      max-height: 90vh;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      display: block;
    }
    .glass-lightbox-close {
      position: absolute;
      top: -40px;
      right: -40px;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      color: white;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      backdrop-filter: blur(8px);
      transition: all 0.2s ease;
    }
    .glass-lightbox-close:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: scale(1.1);
    }
    @media (max-width: 768px) {
      .glass-lightbox-close {
        top: -50px;
        right: 0;
      }
    }
    /* Add pointer cursor to clickable images */
    img.lightbox-enabled {
      cursor: zoom-in;
      transition: transform 0.3s ease;
    }
    img.lightbox-enabled:hover {
      transform: scale(1.02);
    }
  `;
  document.head.appendChild(style);

  // 2. Create the Lightbox DOM
  const overlay = document.createElement('div');
  overlay.className = 'glass-lightbox-overlay';
  
  const content = document.createElement('div');
  content.className = 'glass-lightbox-content';
  
  const imgElement = document.createElement('img');
  imgElement.className = 'glass-lightbox-img';
  imgElement.alt = 'Expanded View';
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'glass-lightbox-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Close image viewer');
  
  content.appendChild(imgElement);
  content.appendChild(closeBtn);
  overlay.appendChild(content);
  document.body.appendChild(overlay);

  // 3. Logic to Open/Close
  const openLightbox = (src) => {
    imgElement.src = src;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  };

  const closeLightbox = () => {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { imgElement.src = ''; }, 400); // clear after transition
  };

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeLightbox();
    }
  });

  // 4. Attach to all valid images on the page
  // Exclude logos, icons, avatars, small UI elements
  const allImages = document.querySelectorAll('img');
  allImages.forEach(img => {
    const src = img.getAttribute('src') || '';
    const className = img.className.toLowerCase();
    const isExcluded = 
      src.includes('logo') || 
      src.includes('icon') || 
      className.includes('logo') || 
      className.includes('icon') || 
      img.closest('header') || 
      img.closest('nav') ||
      img.closest('footer');
      
    if (!isExcluded) {
      img.classList.add('lightbox-enabled');
      img.addEventListener('click', () => {
        openLightbox(img.src);
      });
    }
  });
});
