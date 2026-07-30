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
        visibleCount++;
        const parentSec = card.closest('.reveal-up');
        if (parentSec) sectionVisibility.set(parentSec, true);
      } else {
        card.style.display = 'none';
      }
    });

    // Hide sections that have no visible cards
    sections.forEach((isVisible, sec) => {
      // Don't hide the interactive tools section if we are filtering, unless search is used
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
