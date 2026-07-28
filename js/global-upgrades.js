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
