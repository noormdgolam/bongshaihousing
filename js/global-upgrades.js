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
// Image parallax/zoom removed: images now render at their natural scale with no
// scroll-driven transform. Click-to-zoom (the lightbox) is unaffected.

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

// Scroll Progress Bar: lives in js/scroll-progress.js (a duplicate,
// un-throttled copy of this used to live here — removed to stop two
// separate scroll listeners fighting over two stacked progress bars).

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
// Phase 2: Floating FAQ Chatbot (scripted, no AI/API — keyword-matched
// free-text replies + button menu + human handoff via WhatsApp/Call/Email)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const oldWhatsapp = document.querySelector('.whatsapp-float');
    if(oldWhatsapp) oldWhatsapp.style.display = 'none';

    const CATEGORIES = {
        apartment: { label: 'Apartment Building', labelBn: 'অ্যাপার্টমেন্ট বিল্ডিং', hub: 'apartment-building.html', prefix: 'bh-tsb', start: 101, end: 112, kw: ['apartment', 'flat', 'flats', 'অ্যাপার্টমেন্ট', 'ফ্ল্যাট'] },
        duplex: { label: 'Duplex Steel Building', labelBn: 'ডুপ্লেক্স স্টিল বিল্ডিং', hub: 'duplex-steel-building.html', prefix: 'bh-dv', start: 201, end: 212, kw: ['duplex', 'ডুপ্লেক্স'] },
        simplex: { label: 'Simplex Steel Building', labelBn: 'সিমপ্লেক্স স্টিল বিল্ডিং', hub: 'simplex-steel-building.html', prefix: 'bh-sb', start: 301, end: 312, kw: ['simplex', 'সিমপ্লেক্স'] },
        cottage: { label: 'Cottage House', labelBn: 'কটেজ হাউস', hub: 'cottage-house.html', prefix: 'bh-ch', start: 401, end: 412, kw: ['cottage', 'কটেজ'] },
        container: { label: 'Container House', labelBn: 'কনটেইনার হাউস', hub: 'container-house.html', prefix: 'bh-ch', start: 501, end: 512, kw: ['container', 'কনটেইনার'] },
        steel: { label: 'Steel House', labelBn: 'স্টিল হাউস', hub: 'steel-house.html', prefix: 'bh-sh', start: 601, end: 612, kw: ['steel house', 'steel home', 'স্টিল হাউস'] },
        tiny: { label: 'Tiny House', labelBn: 'টাইনি হাউস', hub: 'tiny-house.html', prefix: 'bh-th', start: 701, end: 712, kw: ['tiny house', 'tiny home', 'টাইনি হাউস', 'ছোট বাড়ি'] },
        wooden: { label: 'Wooden House', labelBn: 'কাঠের বাড়ি', hub: 'wooden-house.html', prefix: 'bh-wh', start: 801, end: 812, kw: ['wooden house', 'wood house', 'কাঠের বাড়ি'] },
        concrete: { label: 'Concrete Building', labelBn: 'কংক্রিট বিল্ডিং', hub: 'concrete-building.html', prefix: 'bh-cb', start: 901, end: 912, kw: ['concrete', 'কংক্রিট'] },
        industrial: { label: 'Industrial Steel Sheds', labelBn: 'ইন্ডাস্ট্রিয়াল স্টিল শেড', hub: 'industrial-sheds.html', prefix: 'bh-is', start: 1001, end: 1012, kw: ['industrial', 'shed', 'factory', 'warehouse', 'ইন্ডাস্ট্রিয়াল', 'শেড', 'কারখানা'] },
        worker: { label: 'Worker Accommodation', labelBn: 'শ্রমিক আবাসন', hub: 'worker-accommodation.html', prefix: 'bh-wa', start: 1101, end: 1112, kw: ['worker accommodation', 'labor camp', 'labour camp', 'dormitory', 'শ্রমিক আবাসন', 'শ্রমিক'] }
    };

    const STR = {
        en: {
            headerTitle: 'Bongshai Assistant',
            langToggleTitle: 'বাংলায় দেখুন',
            welcome: '👋 Hi! I’m a scripted assistant, not a live agent — pick a topic below, or type your question and I’ll do my best to answer.',
            inputPlaceholder: 'Type your question…',
            send: 'Send',
            backCategories: '🔙 Categories',
            backMain: '🔙 Main Menu',
            productsLabel: '🏢 Our Products',
            pricingLabel: '💰 Pricing &amp; Packages',
            areasLabel: '📍 Service Areas',
            visitLabel: '🗓️ Book a Site Visit',
            processLabel: '📋 How It Works',
            certsLabel: '📜 Certifications',
            humanLabel: '📞 Talk to a Human',
            productsIntro: 'Sure — pick a category to see its models:',
            pricingReply: 'Pricing depends on floor area, floors, and finish level. Try our instant cost calculator, or contact us for a custom quote.',
            pricingLinkText: 'Open cost calculator →',
            areasReply: 'We serve all 64 districts across Bangladesh, with dedicated teams in Dhaka, Chattogram, and Cumilla.',
            areasLinkText: 'See all service areas →',
            visitReply: 'Happy to set that up — share your preferred date, time, and location with our team and we’ll confirm it:',
            processReply: 'Every project follows 4 steps — Consultation, Design &amp; Planning, Construction, and Handover — with payment released in stages as work progresses.',
            processLinkText: 'See the full process →',
            certsReply: 'Bongshai Housing is ISO 9001 and OHSAS 18001 / ISO 45001 certified, with in-house material testing.',
            certsLinkText: 'View certifications →',
            humanReply: 'Reach our team directly:',
            whatsappLabel: '📲 WhatsApp',
            callLabel: '📞 Call Us',
            emailLabel: '✉️ Email Us',
            greeting: 'Hello! 👋 How can I help — products, pricing, service areas, or booking a site visit?',
            thanks: 'You’re welcome! Anything else I can help with?',
            fallback: 'I’m not totally sure I understood that — here’s what I can help with, or tap “Talk to a Human” for a real answer:',
            categoryIntro: (label, hub) => 'Here are the ' + label + ' models — pick one, or <a href="' + hub + '">view them all →</a>',
            modelReply: (code, href) => 'Here’s the ' + code + ' page: <a href="' + href + '">View ' + code + ' →</a>'
        },
        bn: {
            headerTitle: 'বংশাই সহকারী',
            langToggleTitle: 'View in English',
            welcome: '👋 হাই! আমি একটি স্ক্রিপ্টেড সহকারী, সরাসরি এজেন্ট নই — নিচে থেকে একটি বিষয় বেছে নিন, অথবা আপনার প্রশ্ন টাইপ করুন।',
            inputPlaceholder: 'আপনার প্রশ্ন লিখুন…',
            send: 'পাঠান',
            backCategories: '🔙 ক্যাটাগরি',
            backMain: '🔙 প্রধান মেনু',
            productsLabel: '🏢 আমাদের পণ্য',
            pricingLabel: '💰 মূল্য ও প্যাকেজ',
            areasLabel: '📍 সেবা এলাকা',
            visitLabel: '🗓️ সাইট ভিজিট বুক করুন',
            processLabel: '📋 কার্যপ্রণালী',
            certsLabel: '📜 সার্টিফিকেশন',
            humanLabel: '📞 মানুষের সাথে কথা বলুন',
            productsIntro: 'নিশ্চয়ই — একটি ক্যাটাগরি বেছে নিন এর মডেলগুলো দেখতে:',
            pricingReply: 'মূল্য নির্ভর করে জায়গার আয়তন, ফ্লোর সংখ্যা এবং ফিনিশিংয়ের মানের উপর। তাৎক্ষণিক খরচ ক্যালকুলেটর ব্যবহার করুন, অথবা কাস্টম কোটেশনের জন্য যোগাযোগ করুন।',
            pricingLinkText: 'খরচ ক্যালকুলেটর খুলুন →',
            areasReply: 'আমরা বাংলাদেশের ৬৪টি জেলায় সেবা প্রদান করি, ঢাকা, চট্টগ্রাম এবং কুমিল্লায় বিশেষায়িত টিম রয়েছে।',
            areasLinkText: 'সব সেবা এলাকা দেখুন →',
            visitReply: 'নিশ্চয়ই — আপনার পছন্দের তারিখ, সময় ও স্থান জানান, আমরা তা নিশ্চিত করব:',
            processReply: 'প্রতিটি প্রকল্প ৪টি ধাপে সম্পন্ন হয় — পরামর্শ, ডিজাইন ও পরিকল্পনা, নির্মাণ এবং হস্তান্তর — এবং কাজের অগ্রগতি অনুযায়ী ধাপে ধাপে পেমেন্ট নেওয়া হয়।',
            processLinkText: 'সম্পূর্ণ প্রক্রিয়া দেখুন →',
            certsReply: 'বংশাই হাউজিং আইএসও ৯০০১ এবং OHSAS ১৮০০১ / আইএসও ৪৫০০১ সনদপ্রাপ্ত, এবং নিজস্ব উপকরণ পরীক্ষার ব্যবস্থা রয়েছে।',
            certsLinkText: 'সার্টিফিকেশন দেখুন →',
            humanReply: 'সরাসরি আমাদের টিমের সাথে যোগাযোগ করুন:',
            whatsappLabel: '📲 হোয়াটসঅ্যাপ',
            callLabel: '📞 কল করুন',
            emailLabel: '✉️ ইমেইল করুন',
            greeting: 'হ্যালো! 👋 আমি কীভাবে সাহায্য করতে পারি — পণ্য, মূল্য, সেবা এলাকা, নাকি ভিজিট বুকিং?',
            thanks: 'স্বাগতম! আর কিছু জানতে চান?',
            fallback: 'দুঃখিত, ঠিক বুঝতে পারিনি — নিচে কিছু বিষয় দেখুন, অথবা সরাসরি মানুষের সাথে কথা বলতে ট্যাপ করুন:',
            categoryIntro: (label, hub) => 'এই ' + label + ' মডেলগুলো দেখুন — একটি বেছে নিন, অথবা <a href="' + hub + '">সবগুলো দেখুন →</a>',
            modelReply: (code, href) => code + ' পৃষ্ঠাটি এখানে: <a href="' + href + '">' + code + ' দেখুন →</a>'
        }
    };

    const INTENTS = [
        { key: 'greeting', re: /\b(hi|hello|hey|salam|assalamu|আসসালামু|হ্যালো|হাই)\b/i },
        { key: 'thanks', re: /\b(thanks|thank you|dhonnobad|ধন্যবাদ)\b/i },
        { key: 'pricing', re: /price|cost|budget|taka|৳|package|দাম|মূল্য|বাজেট|কত টাকা/i },
        { key: 'areas', re: /\b(area|areas|location|district|dhaka|chittagong|chattogram|cumilla)\b|কোথায়|এলাকা|জেলা/i },
        { key: 'visit', re: /\bvisit\b|appointment|book a|meet up|দেখা করতে|ভিজিট|অ্যাপয়েন্টমেন্ট/i },
        { key: 'process', re: /process|payment plan|installment|instalment|handover|how it works|registration|রেজিস্ট্রেশন|প্রক্রিয়া|পেমেন্ট|কিস্তি|হস্তান্তর/i },
        { key: 'certs', re: /certificat|\biso\b|legit|trust|genuine|আসল|বিশ্বাস|সনদ/i },
        { key: 'human', re: /\bhuman\b|\bagent\b|talk to (someone|a person)|call me|manush|মানুষ|কথা বলতে/i },
        { key: 'products', re: /product|model|building|house|package|পণ্য|মডেল|বাড়ি/i }
    ];

    const widget = document.createElement('div');
    widget.className = 'floating-widget';

    const mainBtn = document.createElement('div');
    mainBtn.className = 'floating-main-btn';
    mainBtn.innerHTML = '💬';

    const panel = document.createElement('div');
    panel.className = 'chat-panel';
    panel.innerHTML = '<div class="chat-panel-header"><span class="chat-header-title"></span><div class="chat-header-actions"><button type="button" class="chat-lang-toggle">EN/বাং</button><button type="button" class="chat-close" aria-label="Close chat">&times;</button></div></div><div class="chat-panel-body"><div class="chat-quick-replies"></div></div><form class="chat-input-row"><div class="chat-input-wrap"><input type="text" class="chat-input" autocomplete="off"><button type="submit" class="chat-send">➤</button></div></form>';

    const body = panel.querySelector('.chat-panel-body');
    const quickReplies = panel.querySelector('.chat-quick-replies');
    const headerTitle = panel.querySelector('.chat-header-title');
    const langBtn = panel.querySelector('.chat-lang-toggle');
    const form = panel.querySelector('.chat-input-row');
    const input = panel.querySelector('.chat-input');
    const sendBtn = panel.querySelector('.chat-send');

    let view = 'root';
    let lang = 'en';
    let welcomed = false;

    const t = () => STR[lang];

    const addMsg = (html, cls) => {
        const msg = document.createElement('div');
        msg.className = 'chat-msg ' + cls;
        msg.innerHTML = html;
        body.insertBefore(msg, quickReplies);
        body.scrollTop = body.scrollHeight;
        return msg;
    };

    const addQuickReply = (label, onClick) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chat-quick-reply';
        btn.innerHTML = label;
        btn.addEventListener('click', onClick);
        quickReplies.appendChild(btn);
    };

    const showTyping = (then) => {
        const typing = document.createElement('div');
        typing.className = 'chat-msg bot chat-typing';
        typing.innerHTML = '<span></span><span></span><span></span>';
        body.insertBefore(typing, quickReplies);
        body.scrollTop = body.scrollHeight;
        setTimeout(() => {
            typing.remove();
            then();
        }, 500);
    };

    const applyStrings = () => {
        headerTitle.textContent = t().headerTitle;
        langBtn.title = t().langToggleTitle;
        input.placeholder = t().inputPlaceholder;
        sendBtn.setAttribute('aria-label', t().send);
    };

    const render = () => {
        quickReplies.innerHTML = '';

        if (view === 'root') {
            addQuickReply(t().productsLabel, () => selectTopic('products'));
            addQuickReply(t().pricingLabel, () => selectTopic('pricing'));
            addQuickReply(t().areasLabel, () => selectTopic('areas'));
            addQuickReply(t().visitLabel, () => selectTopic('visit'));
            addQuickReply(t().processLabel, () => selectTopic('process'));
            addQuickReply(t().certsLabel, () => selectTopic('certs'));
            addQuickReply(t().humanLabel, () => selectTopic('human'));
            return;
        }

        if (view === 'categories') {
            Object.entries(CATEGORIES).forEach(([key, c]) => {
                addQuickReply(lang === 'bn' ? c.labelBn : c.label, () => selectCategory(key));
            });
            addQuickReply(t().backMain, () => { view = 'root'; render(); });
            return;
        }

        const cat = CATEGORIES[view];
        for (let n = cat.start; n <= cat.end; n++) {
            const code = cat.prefix.toUpperCase() + '-' + n;
            addQuickReply(code, () => selectModel(view, n));
        }
        addQuickReply(t().backCategories, () => { view = 'categories'; render(); });
        addQuickReply(t().backMain, () => { view = 'root'; render(); });
    };

    const replyForTopic = (key) => {
        if (key === 'human') {
            return t().humanReply + '<div class="chat-human-links"><a href="https://wa.me/8801781636613" target="_blank" rel="noopener">' + t().whatsappLabel + '</a><a href="tel:+8801781636613">' + t().callLabel + '</a><a href="mailto:sales@bongshai.com">' + t().emailLabel + '</a></div>';
        }
        if (key === 'visit') {
            return t().visitReply + '<div class="chat-human-links"><a href="https://wa.me/8801781636613" target="_blank" rel="noopener">' + t().whatsappLabel + '</a><a href="tel:+8801781636613">' + t().callLabel + '</a><a href="contact.html">' + (lang === 'bn' ? 'যোগাযোগ ফর্ম →' : 'Contact form →') + '</a></div>';
        }
        if (key === 'process') {
            return t().processReply + ' <a href="index.html#process">' + t().processLinkText + '</a>';
        }
        if (key === 'pricing') {
            return t().pricingReply + ' <a href="solutions.html">' + t().pricingLinkText + '</a>';
        }
        if (key === 'areas') {
            return t().areasReply + ' <a href="service-areas.html">' + t().areasLinkText + '</a>';
        }
        if (key === 'certs') {
            return t().certsReply + ' <a href="certifications.html">' + t().certsLinkText + '</a>';
        }
        return null;
    };

    const selectTopic = (key) => {
        const labelKey = key + 'Label';
        addMsg(t()[labelKey], 'user');

        if (key === 'products') {
            showTyping(() => {
                addMsg(t().productsIntro, 'bot');
                view = 'categories';
                render();
            });
            return;
        }

        showTyping(() => addMsg(replyForTopic(key), 'bot'));
    };

    const selectCategory = (key) => {
        const cat = CATEGORIES[key];
        const label = lang === 'bn' ? cat.labelBn : cat.label;
        addMsg(label, 'user');
        showTyping(() => {
            addMsg(t().categoryIntro(label, cat.hub), 'bot');
            view = key;
            render();
        });
    };

    const selectModel = (catKey, n) => {
        const cat = CATEGORIES[catKey];
        const code = cat.prefix.toUpperCase() + '-' + n;
        const href = cat.prefix + '-' + n + '.html';
        addMsg(code, 'user');
        showTyping(() => addMsg(t().modelReply(code, href), 'bot'));
    };

    const findModelByNumber = (n) => {
        for (const key in CATEGORIES) {
            const cat = CATEGORIES[key];
            if (n >= cat.start && n <= cat.end) return key;
        }
        return null;
    };

    const findCategoryByKeyword = (text) => {
        for (const key in CATEGORIES) {
            const cat = CATEGORIES[key];
            if (cat.kw.some((k) => text.indexOf(k) !== -1)) return key;
        }
        return null;
    };

    const handleFreeText = (raw) => {
        const text = raw.trim();
        if (!text) return;
        addMsg(text.replace(/</g, '&lt;'), 'user');
        input.value = '';

        const lower = text.toLowerCase();

        // 1) A model number anywhere in the text (e.g. "BH-CB-901", "cb 901", "901")
        const numMatch = lower.match(/\d{3,4}/);
        if (numMatch) {
            const n = parseInt(numMatch[0], 10);
            const catKey = findModelByNumber(n);
            if (catKey) {
                const cat = CATEGORIES[catKey];
                const code = cat.prefix.toUpperCase() + '-' + n;
                const href = cat.prefix + '-' + n + '.html';
                showTyping(() => addMsg(t().modelReply(code, href), 'bot'));
                return;
            }
        }

        // 2) A category name/keyword (e.g. "duplex", "industrial shed")
        const catKey = findCategoryByKeyword(lower);
        if (catKey) {
            showTyping(() => {
                const cat = CATEGORIES[catKey];
                const label = lang === 'bn' ? cat.labelBn : cat.label;
                addMsg(t().categoryIntro(label, cat.hub), 'bot');
                view = catKey;
                render();
            });
            return;
        }

        // 3) Everything else: match against the keyword intents in order
        for (let i = 0; i < INTENTS.length; i++) {
            if (INTENTS[i].re.test(lower)) {
                const key = INTENTS[i].key;
                if (key === 'greeting') { showTyping(() => addMsg(t().greeting, 'bot')); return; }
                if (key === 'thanks') { showTyping(() => addMsg(t().thanks, 'bot')); return; }
                if (key === 'products') {
                    showTyping(() => { addMsg(t().productsIntro, 'bot'); view = 'categories'; render(); });
                    return;
                }
                showTyping(() => addMsg(replyForTopic(key), 'bot'));
                return;
            }
        }

        // 4) Fallback
        showTyping(() => { addMsg(t().fallback, 'bot'); view = 'root'; render(); });
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFreeText(input.value);
    });

    langBtn.addEventListener('click', () => {
        lang = lang === 'en' ? 'bn' : 'en';
        applyStrings();
        render();
    });

    applyStrings();
    if (!welcomed) {
        addMsg(t().welcome, 'bot');
        welcomed = true;
    }
    render();
    widget.appendChild(mainBtn);
    widget.appendChild(panel);
    document.body.appendChild(widget);

    const openPanel = () => {
        widget.classList.add('active');
        mainBtn.innerHTML = '✕';
    };
    const closePanel = () => {
        widget.classList.remove('active');
        mainBtn.innerHTML = '💬';
    };

    mainBtn.addEventListener('click', () => {
        widget.classList.contains('active') ? closePanel() : openPanel();
    });
    panel.querySelector('.chat-close').addEventListener('click', closePanel);

    document.addEventListener('click', (e) => {
        if (!widget.contains(e.target) && widget.classList.contains('active')) closePanel();
    });
});

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
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    headings.forEach(el => {
        // Simple check if text contains english letters
        if(!reduceMotion && /[A-Za-z]/.test(el.innerText)) {
            const fx = new TextScramble(el);
            const text = el.innerText;
            el.innerText = ''; // clear immediately
            const restore = () => { el.innerText = text; };
            // Safety net: never let the title stay blank longer than this, no matter
            // what happens to the animation (stalled rAF, backgrounded tab, error, etc.)
            const safetyTimer = setTimeout(restore, 1800);
            setTimeout(() => {
                if (document.hidden) {
                    clearTimeout(safetyTimer);
                    restore();
                    return;
                }
                fx.setText(text).then(() => clearTimeout(safetyTimer)).catch(restore);
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
    
    const updateRing = () => {
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
    };

    // Batch to one update per animation frame instead of running on every
    // raw scroll event, which fires far faster than the screen can repaint
    // and was the main source of scroll jank on this page.
    let ringTicking = false;
    window.addEventListener('scroll', () => {
        if (!ringTicking) {
            requestAnimationFrame(() => {
                updateRing();
                ringTicking = false;
            });
            ringTicking = true;
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
                    toast.innerHTML = `<span class="pwa-toast-icon">\u2714</span> Ready for offline use`;
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
            priceEl.innerText = '\u09F3 ' + displayPrice; // ৳ Taka
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

/* =========================================================
   MOST VIEWED CAROUSEL
   Prev/next arrow scrolling for the .mv-track card strip on
   product detail pages
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.mv-carousel-wrap').forEach((wrap) => {
        const track = wrap.querySelector('.mv-track');
        const prev = wrap.querySelector('.mv-prev');
        const next = wrap.querySelector('.mv-next');
        if (!track || !prev || !next) return;

        const scrollAmount = () => {
            const card = track.querySelector('.mv-card');
            return (card ? card.offsetWidth : 250) + 20;
        };

        const atEnd = () => track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;

        const advance = () => {
            if (atEnd()) {
                track.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
            }
        };

        let timer = setInterval(advance, 3000);
        const stop = () => clearInterval(timer);
        const restart = () => { stop(); timer = setInterval(advance, 3000); };

        prev.addEventListener('click', () => { track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }); restart(); });
        next.addEventListener('click', () => { advance(); restart(); });

        wrap.addEventListener('mouseenter', stop);
        wrap.addEventListener('mouseleave', restart);
        document.addEventListener('visibilitychange', () => { document.hidden ? stop() : restart(); });

        // Drag/swipe-to-scroll (mouse + touch, via Pointer Events)
        let dragging = false;
        let moved = false;
        let startX = 0;
        let startScroll = 0;

        track.addEventListener('pointerdown', (e) => {
            dragging = true;
            moved = false;
            startX = e.clientX;
            startScroll = track.scrollLeft;
            if (track.setPointerCapture) track.setPointerCapture(e.pointerId);
            stop();
        });

        track.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            if (Math.abs(dx) > 4) {
                // Only now treat this as an actual drag (not a plain click) -
                // adding the class earlier would set pointer-events:none on the
                // cards before the click even fires, swallowing every click.
                if (!moved) track.classList.add('dragging');
                moved = true;
            }
            track.scrollLeft = startScroll - dx;
        });

        const endDrag = () => {
            if (!dragging) return;
            dragging = false;
            track.classList.remove('dragging');
            restart();
        };
        track.addEventListener('pointerup', endDrag);
        track.addEventListener('pointercancel', endDrag);
        track.addEventListener('pointerleave', endDrag);

        // Suppress the card-link click that would otherwise fire right after a drag
        track.addEventListener('click', (e) => {
            if (moved) { e.preventDefault(); e.stopPropagation(); }
        }, true);
    });
});
