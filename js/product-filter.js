document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('productSearch');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const noMsg = document.getElementById('noProductsMsg');
  
  if (!searchInput || filterBtns.length === 0) return;

  // Assign categories to cards based on their parent section
  const sections = document.querySelectorAll('.reveal-up');
  sections.forEach(section => {
    const titleEl = section.querySelector('h2');
    if (!titleEl) return;
    
    const title = titleEl.textContent.toLowerCase();
    let category = 'other';
    if (title.includes('residential')) category = 'residential';
    else if (title.includes('commercial') || title.includes('industrial')) category = 'commercial';
    else if (title.includes('site') || title.includes('security')) category = 'site';
    else if (title.includes('tools')) category = 'tools';

    const cards = section.querySelectorAll('.category-card');
    cards.forEach(card => {
      card.setAttribute('data-category', category);
      // Store original display style
      card.dataset.display = window.getComputedStyle(card).display;
    });
  });

  const allCards = document.querySelectorAll('.category-card');
  let currentFilter = 'all';
  let currentSearch = '';

  function filterCards() {
    const parentContainer = document.querySelector('.filter-bar')?.parentElement || document.querySelector('main > div.container');
    if (parentContainer) {
      // Lock container height to current height during filtering to prevent vertical page jump
      const currentHeight = parentContainer.offsetHeight;
      parentContainer.style.minHeight = currentHeight + 'px';
      parentContainer.style.transition = 'min-height 0.35s cubic-bezier(0.165, 0.84, 0.44, 1)';
    }

    let visibleCount = 0;
    
    // Track which sections have visible cards
    const sectionVisibility = new Map();
    sections.forEach(sec => sectionVisibility.set(sec, false));

    allCards.forEach(card => {
      const category = card.getAttribute('data-category');
      const title = card.querySelector('.cat-title')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('.cat-desc')?.textContent.toLowerCase() || '';
      
      const matchesFilter = currentFilter === 'all' || category === currentFilter;
      const matchesSearch = currentSearch === '' || title.includes(currentSearch) || desc.includes(currentSearch);

      if (matchesFilter && matchesSearch) {
        card.style.display = card.dataset.display || 'flex';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        visibleCount++;
        const parentSec = card.closest('.reveal-up');
        if (parentSec) sectionVisibility.set(parentSec, true);
      } else {
        card.style.display = 'none';
        card.style.opacity = '0';
      }
    });

    // Hide sections that have no visible cards
    sections.forEach(sec => {
      const isVisible = sectionVisibility.get(sec);
      const isTools = sec.querySelector('h2')?.textContent.toLowerCase().includes('tools');
      
      if (!isVisible) {
        if (isTools && currentFilter !== 'all' && currentSearch === '') {
          sec.style.display = 'none';
        } else if (isTools && currentFilter === 'all' && currentSearch === '') {
          sec.style.display = '';
        } else {
          sec.style.display = 'none';
        }
      } else {
        sec.style.display = '';
      }
    });

    if (visibleCount === 0) {
      noMsg.style.display = 'block';
    } else {
      noMsg.style.display = 'none';
    }

    // Release min-height smooth lock after transition completes
    if (parentContainer) {
      setTimeout(() => {
        parentContainer.style.minHeight = '';
      }, 350);
    }
  }

  // Event Listeners
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase().trim();
    filterCards();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.classList.add('btn-outline');
      });
      btn.classList.add('active');
      btn.classList.remove('btn-outline');
      
      currentFilter = btn.getAttribute('data-filter');
      filterCards();
    });
  });
});
