document.addEventListener('DOMContentLoaded', () => {
  /* =========================================================
     DARK MODE LOGIC
     ========================================================= */
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

      // Inject Mobile Search Button into Drawer
      const mobileSearchBtn = document.createElement('button');
      mobileSearchBtn.className = 'mobile-nav-link';
      mobileSearchBtn.style.cssText = 'width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:var(--space-4) 0;border-bottom:1px solid var(--grey-100);font-size:var(--fs-base);font-weight:500;color:var(--grey-800); display: flex; align-items: center; gap: 10px;';
      mobileSearchBtn.innerHTML = '🔍 Search Properties';
      mobileSearchBtn.addEventListener('click', () => {
          const drawer = document.getElementById('mobileDrawer');
          const hamburger = document.getElementById('hamburgerBtn');
          if (drawer) drawer.classList.remove('open');
          if (hamburger) {
              hamburger.classList.remove('open');
              hamburger.setAttribute('aria-expanded', 'false');
          }
          document.body.style.overflow = '';
          openSearch();
      });
      
      const mobileDrawerInner = document.querySelector('.mobile-drawer > div');
      if (mobileDrawerInner && mobileDrawerInner.children.length > 0) {
          mobileDrawerInner.insertBefore(mobileSearchBtn, mobileDrawerInner.children[1]); // Insert after Home link
      }


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
    const hoverObserver = new MutationObserver((mutations) => {
        let shouldRebind = false;
        mutations.forEach(mut => {
            if (mut.addedNodes.length > 0) shouldRebind = true;

        if (shouldRebind) {
            // Very basic rebind - in a robust system you'd only bind new elements
            // For now this works for our simple SPA and dynamic galleries
            addHoverLinks();
        }
    });
    hoverObserver.observe(document.body, { childList: true, subtree: true });
});
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
    mainBtn.innerHTML = '\uD83D\uDCAC'; // Chat icon
    
    const menu = document.createElement('div');
    menu.className = 'floating-menu';
    
    const wappItem = document.createElement('a');
    wappItem.className = 'floating-menu-item';
    wappItem.href = 'https://wa.me/8801781636613';
    wappItem.target = '_blank';
    wappItem.innerHTML = '\uD83D\uDCF2';
    wappItem.title = 'WhatsApp';
    
    const phoneItem = document.createElement('a');
    phoneItem.className = 'floating-menu-item';
    phoneItem.href = 'tel:+8801781636613';
    phoneItem.innerHTML = '\uD83D\uDCDE';
    phoneItem.title = 'Call Us';
    
    const emailItem = document.createElement('a');
    emailItem.className = 'floating-menu-item';
    emailItem.href = 'mailto:sales@bongshai.com';
    emailItem.innerHTML = '\u2709\uFE0F'; // ✉️ Email
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
            mainBtn.innerHTML = '\uD83D\uDCAC';
            mainBtn.classList.remove('active');
        }
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if(!widget.contains(e.target) && widget.classList.contains('active')) {
            widget.classList.remove('active');
            mainBtn.innerHTML = '\uD83D\uDCAC';
            mainBtn.classList.remove('active');
        }
    });
});

// ==========================================================================
// Phase 3: Text Scramble Reveal Effect
// ==========================================================================
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }
    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }
    update() {
        let output = '';
        let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span class="dud" style="color:var(--grey-400)">${char}</span>`;
            } else {
                output += from;
            }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Only target english headings (bangla fonts don't scramble well)
    const headings = document.querySelectorAll('h1.page-hero-title, .hero h1');
    headings.forEach(el => {
        // Simple check if text contains english letters
        if(/[A-Za-z]/.test(el.innerText)) {
            const fx = new TextScramble(el);
            const text = el.innerText;
            el.innerText = ''; // clear immediately
            setTimeout(() => {
                fx.setText(text);
            }, 300); // Wait for page transition
        }
    });
});

// ==========================================================================
// Phase 3: Animated Number Counters
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const counters = document.querySelectorAll('.animate-counter');
    
    if(counters.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const finalValue = parseInt(target.getAttribute('data-target') || target.innerText.replace(/\D/g, ''));
                    
                    if(isNaN(finalValue)) return;
                    
                    let startValue = 0;
                    const duration = 2000;
                    const frameDuration = 1000 / 60;
                    const totalFrames = Math.round(duration / frameDuration);
                    const increment = finalValue / totalFrames;
                    
                    const counter = setInterval(() => {
                        startValue += increment;
                        if(startValue >= finalValue) {
                            clearInterval(counter);
                            target.innerText = finalValue;
                        } else {
                            target.innerText = Math.ceil(startValue);
                        }
                    }, frameDuration);
                    
                    observer.unobserve(target);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => observer.observe(counter));
    }
});

// ==========================================================================
// Phase 3: Back to Top Progress Ring
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const ring = document.createElement('div');
    ring.className = 'back-to-top-ring';
    ring.innerHTML = `
        <svg viewBox="0 0 44 44">
            <circle class="ring-bg" cx="22" cy="22" r="20"></circle>
            <circle class="ring-progress" cx="22" cy="22" r="20"></circle>
        </svg>
        <div class="back-to-top-arrow">&#8593;</div>
    `;
    
    document.body.appendChild(ring);
    
    const circle = ring.querySelector('.ring-progress');
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
    
    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        
        if (scrollTop > 300) {
            ring.classList.add('active');
        } else {
            ring.classList.remove('active');
        }
        
        if(scrollHeight > 0) {
            const scrollPercentage = scrollTop / scrollHeight;
            const drawLength = circumference * scrollPercentage;
            circle.style.strokeDashoffset = circumference - drawLength;
        }
    }, {passive: true});
    
    ring.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

// ==========================================================================
// Phase 3: PWA Offline Toast
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Show toast if SW is registered
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            // Check if we already showed it this session
            if(!sessionStorage.getItem('pwaToastShown')) {
                setTimeout(() => {
                    const toast = document.createElement('div');
                    toast.className = 'pwa-toast';
                    toast.innerHTML = `<span class="pwa-toast-icon">âœ“</span> Ready for offline use`;
                    document.body.appendChild(toast);
                    
                    // Trigger animation
                    requestAnimationFrame(() => {
                        toast.classList.add('show');
                    });
                    
                    // Hide after 4 seconds
                    setTimeout(() => {
                        toast.classList.remove('show');
                        setTimeout(() => toast.remove(), 500);
                    }, 4000);
                    
                    sessionStorage.setItem('pwaToastShown', 'true');
                }, 2000); // Show 2 seconds after page load
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Dynamically find stat numbers that look like "500+", "64", "10+" inside stats sections
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    const nodesToWrap = [];
    
    while(node = walker.nextNode()) {
        if(node.parentElement && (node.parentElement.tagName === 'H2' || node.parentElement.tagName === 'H3' || node.parentElement.classList.contains('stat-number') || node.parentElement.classList.contains('number'))) {
            // Check if it's purely a number (with optional +)
            const text = node.nodeValue.trim();
            if(/^\d+\+?$/.test(text) && parseInt(text) > 5) {
                nodesToWrap.push(node);
            }
        }
    }
    
    nodesToWrap.forEach(textNode => {
        const parent = textNode.parentElement;
        const val = parseInt(textNode.nodeValue);
        const hasPlus = textNode.nodeValue.includes('+');
        
        // Wrap it
        parent.innerHTML = parent.innerHTML.replace(textNode.nodeValue, `<span class="animate-counter" data-target="${val}">${val}</span>${hasPlus ? '+' : ''}`);
    });
});

// ==========================================================================
// Phase 4: Ambient Cursor Glow (Dark Mode)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    if(window.matchMedia("(pointer: coarse)").matches) return; // Skip mobile
    
    const glow = document.createElement('div');
    glow.className = 'ambient-glow';
    document.body.appendChild(glow);
    
    document.addEventListener('mousemove', (e) => {
        glow.style.setProperty('--mouse-x', e.clientX + 'px');
        glow.style.setProperty('--mouse-y', e.clientY + 'px');
    });
});

// ==========================================================================
// Phase 4: Dynamic Project Filtering
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const filterItems = document.querySelectorAll('.filter-item');
    
    if(filterBtns.length > 0 && filterItems.length > 0) {
        // Assign random categories if they don't have them (for demo)
        const categories = ['duplex', 'low-cost', 'ongoing', 'completed'];
        filterItems.forEach(item => {
            if(!item.getAttribute('data-category')) {
                // Pick 1 or 2 random categories
                const cat1 = categories[Math.floor(Math.random() * categories.length)];
                item.setAttribute('data-category', cat1);
            }
        });
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filterValue = btn.getAttribute('data-filter');
                
                filterItems.forEach(item => {
                    if(filterValue === 'all' || item.getAttribute('data-category').includes(filterValue)) {
                        item.classList.remove('hide');
                        // Hack to force reflow so transition works when removing position absolute
                        setTimeout(() => item.style.position = 'relative', 400);
                    } else {
                        item.classList.add('hide');
                        // Delay position absolute so it fades out first
                        setTimeout(() => item.style.position = 'absolute', 400);
                    }
                });
            });
        });
    }
});

// ==========================================================================
// Phase 4: Before & After Image Slider
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const sliders = document.querySelectorAll('.ba-slider');
    
    sliders.forEach(slider => {
        const afterImg = slider.querySelector('.img-after');
        const handle = slider.querySelector('.slider-handle');
        const innerImg = afterImg.querySelector('img');
        let isDragging = false;
        
        const move = (clientX) => {
            const rect = slider.getBoundingClientRect();
            let x = clientX - rect.left;
            // Constrain
            if (x < 0) x = 0;
            if (x > rect.width) x = rect.width;
            
            const percent = (x / rect.width) * 100;
            afterImg.style.width = percent + '%';
            handle.style.left = percent + '%';
            
            // Adjust the inner image width inversely so it doesn't stretch
            innerImg.style.width = (100 / (percent / 100)) + '%';
        };
        
        // Mouse Events
        handle.addEventListener('mousedown', () => isDragging = true);
        document.addEventListener('mouseup', () => isDragging = false);
        document.addEventListener('mousemove', (e) => {
            if(isDragging) move(e.clientX);
        });
        
        // Touch Events
        handle.addEventListener('touchstart', () => isDragging = true, {passive: true});
        document.addEventListener('touchend', () => isDragging = false);
        document.addEventListener('touchmove', (e) => {
            if(isDragging) {
                move(e.touches[0].clientX);
                if(e.cancelable) e.preventDefault(); // prevent scroll
            }
        }, {passive: false});
    });
});

// ==========================================================================
// Phase 4: Real-Time Cost Estimator
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const estCard = document.querySelector('.estimator-card');
    if(!estCard) return;
    
    const landInput = document.getElementById('estLand');
    const landVal = document.getElementById('estLandVal');
    const floorInput = document.getElementById('estFloors');
    const floorVal = document.getElementById('estFloorsVal');
    const priceEl = document.getElementById('estTotalPrice');
    
    if(!landInput || !floorInput || !priceEl) return;
    
    // Base assumptions (Tk per sqft construction)
    // 1 Katha = 720 sqft. Let's assume buildable area is 70% of land.
    // Cost = 2500 Tk per sqft.
    const costPerSqft = 2500;
    
    function calculate() {
        const katha = parseFloat(landInput.value);
        const floors = parseInt(floorInput.value);
        
        landVal.innerText = katha + (katha === 1 ? ' Katha' : ' Kathas');
        floorVal.innerText = floors + (floors === 1 ? ' Floor' : ' Floors');
        
        const buildableSqft = katha * 720 * 0.7; // 70% coverage
        const totalSqft = buildableSqft * floors;
        let totalCost = totalSqft * costPerSqft;
        
        // Add foundation cost non-linearity
        if(floors > 3) totalCost *= 1.1;
        if(floors > 6) totalCost *= 1.2;
        
        // Format to BDT standard (crores/lakhs)
        let displayPrice = '';
        if(totalCost >= 10000000) {
            displayPrice = (totalCost / 10000000).toFixed(2) + ' Crore';
        } else if(totalCost >= 100000) {
            displayPrice = (totalCost / 100000).toFixed(2) + ' Lakh';
        } else {
            displayPrice = totalCost.toLocaleString();
        }
        
        // Animate price change
        priceEl.style.opacity = 0;
        setTimeout(() => {
            priceEl.innerText = 'â§³ ' + displayPrice;
            priceEl.style.opacity = 1;
        }, 150);
    }
    
    landInput.addEventListener('input', calculate);
    floorInput.addEventListener('input', calculate);
    
    // Initial calc
    calculate();
});


// ==========================================================================
// Interactive SVG Floor Plan Logic
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const rooms = document.querySelectorAll('.room');
    const tooltip = document.getElementById('room-tooltip');
    const ttTitle = document.getElementById('tt-title');
    const ttDesc = document.getElementById('tt-desc');
    const panelTitle = document.getElementById('panel-title');
    const panelDesc = document.getElementById('panel-desc');
    const panelFeatures = document.getElementById('panel-features');

    if (rooms.length > 0) {
        rooms.forEach(room => {
            room.addEventListener('mousemove', (e) => {
                const name = room.getAttribute('data-name');
                const details = room.getAttribute('data-details');
                
                // Tooltip follow mouse
                if (tooltip) {
                    tooltip.style.display = 'block';
                    tooltip.style.left = (e.pageX + 15) + 'px';
                    tooltip.style.top = (e.pageY + 15) + 'px';
                    ttTitle.innerHTML = name;
                    ttDesc.innerHTML = details;
                }
            });

            room.addEventListener('mouseleave', () => {
                if (tooltip) tooltip.style.display = 'none';
            });

            room.addEventListener('click', () => {
                const name = room.getAttribute('data-name');
                const details = room.getAttribute('data-details');
                
                if (panelTitle && panelDesc) {
                    panelTitle.innerHTML = name;
                    panelDesc.innerHTML = details;
                    
                    // Generate list items based on split details
                    if (panelFeatures) {
                        panelFeatures.innerHTML = '';
                        const parts = details.split('<br>');
                        parts.forEach(part => {
                            if (part.trim() !== '') {
                                const li = document.createElement('li');
                                li.className = 'flex items-center text-sm text-gray-700 font-medium bg-gray-50 p-2 rounded';
                                li.innerHTML = `<i class="fas fa-cube text-accent mr-2"></i> ${part}`;
                                panelFeatures.appendChild(li);
                            }
                        });
                    }
                }
            });
        });
    }
});


// ==========================================================================
// Dark Mode Toggle Logic
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('dark-mode-toggle');
    const body = document.body;
    
    // Check local storage
    const isDark = localStorage.getItem('bongshai_dark') === 'true';
    if(isDark) {
        body.classList.add('dark-mode');
        if(toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-sun text-yellow-400 text-xl"></i>';
    }

    if(toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            body.classList.toggle('dark-mode');
            const darkActive = body.classList.contains('dark-mode');
            localStorage.setItem('bongshai_dark', darkActive);
            
            if(darkActive) {
                toggleBtn.innerHTML = '<i class="fas fa-sun text-yellow-400 text-xl"></i>';
            } else {
                toggleBtn.innerHTML = '<i class="fas fa-moon text-gray-700 text-xl"></i>';
            }
        });
    }
});


/* =========================================================
   PWA INSTALL LOGIC (ALWAYS INJECTED)
   ========================================================= */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

function injectInstallButton() {
  if (document.getElementById('pwaInstallBtn')) return;
  const installBtn = document.createElement('button');
  installBtn.id = 'pwaInstallBtn';
  installBtn.className = 'btn btn-primary';
  installBtn.style.cssText = 'width: 100%; margin-top: 15px; display: flex; justify-content: center; align-items: center; gap: 8px; font-weight: bold; padding: 12px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border: none; box-shadow: var(--shadow-md); color: white; border-radius: 8px; cursor: pointer;';
  installBtn.innerHTML = '📱 Install Bongshai App';
  
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        installBtn.style.display = 'none';
      }
      deferredPrompt = null;
    } else {
      alert("To install the Bongshai App, tap 'Add to Home Screen' in your browser menu.");
    }
  });

  const mobileDrawer = document.querySelector('.mobile-drawer > div');
  if (mobileDrawer) {
    mobileDrawer.appendChild(installBtn);
  }
}

document.addEventListener('DOMContentLoaded', injectInstallButton);

/* =========================================================
   AUTO DARK MODE LOGIC (SYSTEM PREFERENCE)
   ========================================================= */
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

function applySystemTheme(e) {
    if (e.matches) {
        document.body.setAttribute('data-theme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
    }
}

// Apply on load
applySystemTheme(mediaQuery);

// Listen for system changes
mediaQuery.addEventListener('change', applySystemTheme);

/* =========================================================
   GLOBAL IMAGE LIGHTBOX — "Click to see full picture"
   Applies to all product images, gallery images, etc.
   ========================================================= */
(function initImageLightbox() {
  // Inject lightbox modal into DOM
  const lightbox = document.createElement('div');
  lightbox.id = 'imgLightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-label', 'Full size image viewer');
  lightbox.innerHTML = `
    <button id="imgLightboxClose" aria-label="Close image viewer">&times;</button>
    <img id="imgLightboxImg" src="" alt="Full size image">
    <p id="imgLightboxCaption"></p>
  `;
  document.body.appendChild(lightbox);

  // Inject CSS for lightbox and caption overlay
  const style = document.createElement('style');
  style.textContent = `
    /* Lightbox Backdrop */
    #imgLightbox {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(0,0,0,0.92);
      align-items: center;
      justify-content: center;
      flex-direction: column;
      padding: 20px;
      box-sizing: border-box;
      cursor: zoom-out;
      animation: lbFadeIn 0.25s ease;
    }
    #imgLightbox.active { display: flex; }

    @keyframes lbFadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to   { opacity: 1; transform: scale(1); }
    }

    #imgLightboxImg {
      max-width: 95vw;
      max-height: 85vh;
      object-fit: contain;
      border-radius: 12px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.6);
      cursor: default;
    }

    #imgLightboxCaption {
      color: rgba(255,255,255,0.8);
      font-size: 0.9rem;
      margin-top: 14px;
      text-align: center;
      font-family: 'Inter', sans-serif;
    }

    #imgLightboxClose {
      position: fixed;
      top: 16px;
      right: 20px;
      background: rgba(255,255,255,0.15);
      border: none;
      color: white;
      font-size: 2rem;
      line-height: 1;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      z-index: 100000;
    }
    #imgLightboxClose:hover { background: rgba(255,255,255,0.3); }

    /* "Click to see full picture" caption overlay on image wrappers */
    .lb-wrap {
      position: relative;
      cursor: zoom-in;
      display: block;
    }
    .lb-wrap::after {
      content: '🔍 Click to see full picture';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.65));
      color: #fff;
      font-size: 0.78rem;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      text-align: center;
      padding: 18px 8px 8px;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      border-radius: 0 0 12px 12px;
    }
    .lb-wrap:hover::after,
    .lb-wrap:focus-within::after {
      opacity: 1;
    }
    /* Always show caption on touch devices (mobile) */
    @media (hover: none) {
      .lb-wrap::after {
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  const lbModal  = document.getElementById('imgLightbox');
  const lbImg    = document.getElementById('imgLightboxImg');
  const lbCap    = document.getElementById('imgLightboxCaption');
  const lbClose  = document.getElementById('imgLightboxClose');

  function openLightbox(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    lbCap.textContent = alt || '';
    lbModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lbModal.classList.remove('active');
    document.body.style.overflow = '';
    lbImg.src = '';
  }

  // Close on backdrop / close button
  lbModal.addEventListener('click', (e) => {
    if (e.target === lbModal || e.target === lbClose) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // Apply lightbox to all target images
  function applyLightbox() {
    const selectors = [
      '.property-img-wrap img',
      '.property-img img',
      '.gallery-img img',
      '.gallery-img',
      '.project-img img',
      '.product-hero-img img',
      'figure img',
      '.page-sidebar-content img',
      '.cat-sidebar ~ div img',
    ];

    const imgs = document.querySelectorAll(selectors.join(', '));
    imgs.forEach(img => {
      // Skip tiny icons, logos, flags, and already wrapped
      if (!img.src || img.width < 60 || img.closest('.lb-wrap') || img.closest('.navbar') || img.closest('.footer')) return;

      const parent = img.parentElement;
      // Wrap if not already a lb-wrap
      if (!parent.classList.contains('lb-wrap')) {
        parent.classList.add('lb-wrap');
      }
      parent.style.cursor = 'zoom-in';

      parent.addEventListener('click', (e) => {
        e.preventDefault();
        openLightbox(img.src, img.alt || img.title || '');
      });
    });
  }

  // Run after DOM settles (handles lazy-loaded images too)
  if (document.readyState === 'complete') {
    applyLightbox();
  } else {
    window.addEventListener('load', applyLightbox);
  }
  // Also observe dynamic content
  const lbObserver = new MutationObserver(() => applyLightbox());
  lbObserver.observe(document.body, { childList: true, subtree: true });
})();

/* =========================================================
   IMAGE PROTECTION
   Prevent right-click (context menu) and dragging on images
   ========================================================= */
(function protectImages() {
  // Prevent context menu (right click / long press) globally
  document.addEventListener('contextmenu', (e) => {
    // Allow right click only on input fields or textareas so users can paste
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return true;
    }
    e.preventDefault();
    return false;
  });

  // Prevent drag and drop of images
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      return false;
    }
  });
})();
