document.addEventListener('DOMContentLoaded', () => {
  /* =========================================================
     DARK MODE LOGIC
     ========================================================= */
  const darkModeBtn = document.getElementById('darkModeBtn');
  
  // Check local storage or system preference
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (darkModeBtn) darkModeBtn.textContent = '☀️';
  }

  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        darkModeBtn.textContent = '🌙';
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        darkModeBtn.textContent = '☀️';
      }
    });
  }

  /* =========================================================
     GLOBAL SEARCH LOGIC
     ========================================================= */
  const searchBtn = document.getElementById('searchBtn');
  let searchIndex = null;
  
  if (searchBtn) {
    // Inject Search Modal UI dynamically
    const searchModal = document.createElement('div');
    searchModal.id = 'searchModal';
    searchModal.innerHTML = `
      <div class="search-modal-content">
        <div class="search-header">
          <input type="text" id="searchInput" placeholder="Search properties, projects, keywords..." autocomplete="off">
          <button id="closeSearchBtn">&times;</button>
        </div>
        <div id="searchResults" class="search-results"></div>
      </div>
    `;
    document.body.appendChild(searchModal);

    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const closeSearchBtn = document.getElementById('closeSearchBtn');

    // Toggle Modal
    const openSearch = async () => {
      searchModal.classList.add('active');
      searchInput.focus();
      document.body.style.overflow = 'hidden';
      
      // Fetch index if not already fetched
      if (!searchIndex) {
        try {
          const res = await fetch('/search-index.json');
          searchIndex = await res.json();
        } catch (e) {
          console.error("Search index not available.", e);
        }
      }
    };

    const closeSearch = () => {
      searchModal.classList.remove('active');
      document.body.style.overflow = '';
      searchInput.value = '';
      searchResults.innerHTML = '';
    };

    searchBtn.addEventListener('click', openSearch);
    closeSearchBtn.addEventListener('click', closeSearch);

    // Close on Escape or click outside
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchModal.classList.contains('active')) closeSearch();
      // Ctrl + K shortcut
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    });
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) closeSearch();
    });

    // Search Filtering
    searchInput.addEventListener('input', (e) => {
      if (!searchIndex) return;
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        searchResults.innerHTML = '';
        return;
      }

      const results = searchIndex.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.desc.toLowerCase().includes(query)
      ).slice(0, 10); // Limit to top 10

      if (results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No results found for "'+query+'"</div>';
        return;
      }

      searchResults.innerHTML = results.map(item => `
        <a href="${item.url}" class="search-result-item">
          <h4>${item.title}</h4>
          <p>${item.desc.substring(0, 80)}...</p>
        </a>
      `).join('');
    });
  }
});

  /* =========================================================
     LANGUAGE TOGGLE LOGIC
     ========================================================= */
  const langToggleBtn = document.getElementById('langToggleBtn');
  if (langToggleBtn) {
    const urlParams = new URLSearchParams(window.location.search);
    const isBn = urlParams.get('lang') === 'bn';
    
    // Set initial text
    langToggleBtn.textContent = isBn ? 'EN' : 'BN';
    
    langToggleBtn.addEventListener('click', () => {
      if (isBn) {
        urlParams.delete('lang');
      } else {
        urlParams.set('lang', 'bn');
      }
      
      // Navigate without triggering the SPA fade-out for a faster language swap,
      // or let it trigger naturally. Let's just set location.
      window.location.search = urlParams.toString();
    });
  }

/* =========================================================
   PWA SERVICE WORKER REGISTRATION
   ========================================================= */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }).catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}


// Maintenance Banner Injection
document.addEventListener('DOMContentLoaded', () => {
    const banner = document.createElement('div');
    banner.id = 'maintenance-banner';
    banner.innerHTML = '<span>🚧 <strong>Maintenance in progress:</strong> Our server upgrade is ongoing. We apologize for the temporary inconvenience.</span><span class="banner-sep">|</span><span><strong>রক্ষণাবেক্ষণ চলছে:</strong> আমাদের সার্ভার আপগ্রেড চলছে। সাময়িক অসুবিধার জন্য আমরা দুঃখিত।</span>';
    document.body.insertBefore(banner, document.body.firstChild);
    
    // Adjust layout for fixed banner
    const adjustLayout = () => {
        const h = banner.offsetHeight;
        document.documentElement.style.setProperty('--banner-height', h + 'px');
    };
    // Observe DOM changes or do it after a small timeout to ensure fonts are loaded
    setTimeout(adjustLayout, 100);
    window.addEventListener('resize', adjustLayout);
});

// ==========================================================================
// Premium Magnetic Cursor Logic
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Only init on desktop
    if (window.innerWidth <= 1024) return;
    
    // Check if touch device
    if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) return;

    const cursor = document.createElement('div');
    cursor.classList.add('magnetic-cursor');
    document.body.appendChild(cursor);

    const follower = document.createElement('div');
    follower.classList.add('magnetic-cursor-follower');
    document.body.appendChild(follower);

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    const render = () => {
        // Fast follow for dot
        cursorX += (mouseX - cursorX) * 0.5;
        cursorY += (mouseY - cursorY) * 0.5;
        cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;

        // Smooth follow for ring
        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;
        follower.style.transform = `translate(${followerX}px, ${followerY}px)`;

        requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    // Hover effect
    const addHoverLinks = () => {
        const hoverElements = document.querySelectorAll('a, button, input[type="submit"], input[type="button"], .cat-item, .clickable, label, .gallery-item');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('hovering');
                follower.classList.add('hovering');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('hovering');
                follower.classList.remove('hovering');
            });
        });
    };
    
    addHoverLinks();
    
    // Re-bind on mutation (for dynamic content like loaded galleries)
    const observer = new MutationObserver((mutations) => {
        let shouldRebind = false;
        mutations.forEach(mut => {
            if (mut.addedNodes.length > 0) shouldRebind = true;
        });
        if (shouldRebind) {
            // Very basic rebind - in a robust system you'd only bind new elements
            // For now this works for our simple SPA and dynamic galleries
            addHoverLinks();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
});
d o c u m e n t . a d d E v e n t L i s t e n e r ( ' D O M C o n t e n t L o a d e d ' ,   ( )   = >   {  
     / /   F a d e   i n   o n   l o a d  
     s e t T i m e o u t ( ( )   = >   {  
         d o c u m e n t . b o d y . c l a s s L i s t . a d d ( ' p a g e - l o a d e d ' ) ;  
     } ,   5 0 ) ;  
  
     / /   I n t e r c e p t   c l i c k s   o n   i n t e r n a l   l i n k s  
     c o n s t   l i n k s   =   d o c u m e n t . q u e r y S e l e c t o r A l l ( ' a [ h r e f ] ' ) ;  
      
     l i n k s . f o r E a c h ( l i n k   = >   {  
         l i n k . a d d E v e n t L i s t e n e r ( ' c l i c k ' ,   ( e )   = >   {  
             c o n s t   t a r g e t U r l   =   l i n k . g e t A t t r i b u t e ( ' h r e f ' ) ;  
              
             / /   D o n ' t   i n t e r c e p t   e x t e r n a l   l i n k s ,   a n c h o r s ,   o r   t a r g e t = " _ b l a n k "  
             i f   (  
                 t a r g e t U r l . s t a r t s W i t h ( ' h t t p ' )   | |  
                 t a r g e t U r l . s t a r t s W i t h ( ' m a i l t o : ' )   | |  
                 t a r g e t U r l . s t a r t s W i t h ( ' t e l : ' )   | |  
                 t a r g e t U r l . s t a r t s W i t h ( ' # ' )   | |  
                 l i n k . g e t A t t r i b u t e ( ' t a r g e t ' )   = = =   ' _ b l a n k '   | |  
                 e . c t r l K e y   | |    
                 e . m e t a K e y  
             )   {  
                 r e t u r n ;  
             }  
  
             / /   I t ' s   a n   i n t e r n a l   l i n k ,   i n t e r c e p t   i t  
             e . p r e v e n t D e f a u l t ( ) ;  
              
             / /   T r i g g e r   f a d e   o u t  
             d o c u m e n t . b o d y . c l a s s L i s t . a d d ( ' p a g e - e x i t ' ) ;  
             d o c u m e n t . b o d y . c l a s s L i s t . r e m o v e ( ' p a g e - l o a d e d ' ) ;  
              
             / /   W a i t   f o r   t r a n s i t i o n   ( 0 . 4 s )   t h e n   n a v i g a t e  
             s e t T i m e o u t ( ( )   = >   {  
                 w i n d o w . l o c a t i o n . h r e f   =   t a r g e t U r l ;  
             } ,   4 0 0 ) ;   / /   4 0 0 m s   m a t c h e s   t h e   C S S   t r a n s i t i o n   t i m e  
         } ) ;  
     } ) ;  
 } ) ;  
 
// ==========================================================================
// Advanced Parallax & Scroll Animations
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Image Parallax (Hero, About, Project covers)
    const parallaxImages = document.querySelectorAll('.hero-bg img, .about-img-wrap img, .service-card img, .property-card img');
    
    // Wrap them if not already wrapped
    parallaxImages.forEach(img => {
        img.classList.add('parallax-img');
        if(!img.parentElement.classList.contains('hero-bg') && !img.parentElement.classList.contains('about-img-wrap')) {
            img.parentElement.classList.add('parallax-container');
        }
    });

    const runParallax = () => {
        const scrolled = window.pageYOffset;
        parallaxImages.forEach(img => {
            const rect = img.parentElement.getBoundingClientRect();
            // Only animate if in viewport
            if(rect.top < window.innerHeight && rect.bottom > 0) {
                // Calculate parallax speed based on position
                const yPos = -(rect.top * 0.15); 
                img.style.transform = `translateY(${yPos}px) scale(1.15)`;
            }
        });
    };

    // Use requestAnimationFrame for smooth scrolling
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                runParallax();
                ticking = false;
            });
            ticking = true;
        }
    }, {passive: true});
    
    // Initial call
    runParallax();
});

// ==========================================================================
// Interactive Hero Particles (Engineering Network Theme)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.hero');
    if (!hero) return; // Only on pages with a hero section
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'hero-particles';
    // Insert behind content but over background
    hero.insertBefore(canvas, hero.querySelector('.hero-content'));
    
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    
    // Configuration
    const particleCount = window.innerWidth > 768 ? 60 : 30;
    const maxDistance = 150;
    
    function resize() {
        width = hero.clientWidth;
        height = hero.clientHeight;
        canvas.width = width;
        canvas.height = height;
    }
    
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > width) this.vx = -this.vx;
            if (this.y < 0 || this.y > height) this.vy = -this.vy;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
        }
    }
    
    function init() {
        resize();
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * (1 - distance / maxDistance)})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    window.addEventListener('resize', () => {
        resize();
    });
    
    init();
    animate();
});

// ==========================================================================
// Premium Lightbox Logic
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('.gallery-item img, .project-card img, .about-img-wrap img');
    if(images.length === 0) return;

    // Create lightbox DOM
    const lightbox = document.createElement('div');
    lightbox.className = 'premium-lightbox';
    
    const closeBtn = document.createElement('div');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '&times;';
    
    const imgEl = document.createElement('img');
    
    lightbox.appendChild(imgEl);
    lightbox.appendChild(closeBtn);
    document.body.appendChild(lightbox);

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        setTimeout(() => {
            imgEl.src = '';
        }, 400); // Wait for transition
    };

    lightbox.addEventListener('click', (e) => {
        if(e.target === lightbox || e.target === closeBtn) {
            closeLightbox();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });

    images.forEach(img => {
        img.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // prevent page transition if it's wrapped in a link
            imgEl.src = img.src;
            lightbox.classList.add('active');
        });
    });
});

// ==========================================================================
// Phase 2: Scroll Progress Bar
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'scroll-progress-container';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress-bar';
    
    progressContainer.appendChild(progressBar);
    document.body.appendChild(progressContainer);
    
    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        
        if(scrollHeight > 0) {
            const scrollPercentage = (scrollTop / scrollHeight) * 100;
            progressBar.style.width = scrollPercentage + '%';
        }
    }, {passive: true});
});

// ==========================================================================
// Phase 2: 3D Tilt Effect
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Only run on desktop
    if(window.matchMedia("(pointer: coarse)").matches) return;
    
    const tiltElements = document.querySelectorAll('.property-card, .gallery-item, .service-card');
    
    tiltElements.forEach(el => {
        el.classList.add('tilt-element');
        
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element.
            const y = e.clientY - rect.top;  // y position within the element.
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Max rotation is 10 degrees
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        el.addEventListener('mouseleave', () => {
            el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });
});

// ==========================================================================
// Phase 2: Floating Quick-Contact Widget
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Hide the old whatsapp float if it exists to replace with this premium one
    const oldWhatsapp = document.querySelector('.whatsapp-float');
    if(oldWhatsapp) oldWhatsapp.style.display = 'none';

    const widget = document.createElement('div');
    widget.className = 'floating-widget';
    
    const mainBtn = document.createElement('div');
    mainBtn.className = 'floating-main-btn';
    mainBtn.innerHTML = 'ðŸ’¬'; // Chat icon
    
    const menu = document.createElement('div');
    menu.className = 'floating-menu';
    
    const wappItem = document.createElement('a');
    wappItem.className = 'floating-menu-item';
    wappItem.href = 'https://wa.me/8801781636613';
    wappItem.target = '_blank';
    wappItem.innerHTML = 'ðŸ“²';
    wappItem.title = 'WhatsApp';
    
    const phoneItem = document.createElement('a');
    phoneItem.className = 'floating-menu-item';
    phoneItem.href = 'tel:+8801781636613';
    phoneItem.innerHTML = 'ðŸ“ž';
    phoneItem.title = 'Call Us';
    
    const emailItem = document.createElement('a');
    emailItem.className = 'floating-menu-item';
    emailItem.href = 'mailto:sales@bongshai.com';
    emailItem.innerHTML = 'âœ‰ï¸ ';
    emailItem.title = 'Email Us';
    
    menu.appendChild(emailItem);
    menu.appendChild(phoneItem);
    menu.appendChild(wappItem);
    
    widget.appendChild(mainBtn);
    widget.appendChild(menu);
    
    document.body.appendChild(widget);
    
    mainBtn.addEventListener('click', () => {
        widget.classList.toggle('active');
        if(widget.classList.contains('active')) {
            mainBtn.innerHTML = '+';
            mainBtn.classList.add('active');
        } else {
            mainBtn.innerHTML = 'ðŸ’¬';
            mainBtn.classList.remove('active');
        }
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if(!widget.contains(e.target) && widget.classList.contains('active')) {
            widget.classList.remove('active');
            mainBtn.innerHTML = 'ðŸ’¬';
            mainBtn.classList.remove('active');
        }
    });
});
