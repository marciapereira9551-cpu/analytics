// =============================================
// LANDING PAGE FUNCTIONS
// =============================================

// DOM Elements
const searchInput = document.getElementById('pageSelectSearch');
const playerSearchInput = document.getElementById('playerSearchInput');
const pageSuggestions = document.getElementById('pageSuggestions');
const playerSuggestions = document.getElementById('playerSuggestions');
const findBtn = document.getElementById('findBtn');

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  const savedPage = sessionStorage.getItem('currentPage');
  
  if (savedPage) {
    selectedPage = savedPage;
    const pageObj = PAGES.find(p => p.name === savedPage);
    if (pageObj) {
      currentPageObj = pageObj;
      // Redirect to dashboard if page is already selected
      window.location.href = 'dashboard.html';
    }
  }
  
  setupEventListeners();
}

function setupEventListeners() {
  // Page search functionality
  searchInput.addEventListener('input', function() {
    const val = this.value.toLowerCase().trim();
    pageSuggestions.innerHTML = '';
    findBtn.style.display = 'none';
    
    if (!val) return;
    
    const matches = PAGES.filter(p => p.name.toLowerCase().includes(val));
    if (matches.length === 0) {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.innerHTML = '<span class="page-emoji">😕</span> No results found';
      pageSuggestions.appendChild(div);
    } else {
      matches.forEach(p => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `
          <span class="page-emoji">${p.emoji}</span>
          <span>${p.name}</span>
        `;
        div.onclick = () => {
          searchInput.value = p.name;
          pageSuggestions.innerHTML = '';
          findBtn.style.display = 'inline-flex';
        };
        pageSuggestions.appendChild(div);
      });
      if (matches.length === 1) {
        findBtn.style.display = 'inline-flex';
      }
    }
  });

  // Player search functionality for LANDING PAGE (All Pages)
  playerSearchInput.addEventListener('input', async function() {
    const val = this.value.toLowerCase().trim();
    playerSuggestions.innerHTML = '';
    
    if (!val || val.length < 2) return;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'suggestion-item';
    loadingDiv.innerHTML = '<span class="page-emoji">⏳</span> Searching players across all pages...';
    playerSuggestions.appendChild(loadingDiv);
    
    try {
      const players = await searchPlayers(val);
      playerSuggestions.innerHTML = '';
      
      if (!players || players.length === 0) {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = '<span class="page-emoji">😕</span> No players found';
        playerSuggestions.appendChild(div);
        return;
      }
      
      players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        
        const pageObj = PAGES.find(p => p.name === player.page);
        const pageEmoji = pageObj ? pageObj.emoji : '📄';
        
        div.innerHTML = `
          <span class="page-emoji">${pageEmoji}</span>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 500; margin-bottom: 0.25rem;">${player.name}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              <span class="page-indicator">${player.page}</span>
            </div>
          </div>
        `;
        
        div.onclick = () => {
          sessionStorage.setItem('searchPlayerName', player.name);
          sessionStorage.setItem('searchPlayerPage', player.page);
          window.location.href = `player-history.html?player=${encodeURIComponent(player.name)}&page=${encodeURIComponent(player.page)}&global=true`;
        };
        
        playerSuggestions.appendChild(div);
      });
    } catch (error) {
      playerSuggestions.innerHTML = '';
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.innerHTML = '<span class="page-emoji">❌</span> Error searching players';
      playerSuggestions.appendChild(div);
    }
  });

  // Click outside to close suggestions
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.search-container')) {
      pageSuggestions.innerHTML = '';
      playerSuggestions.innerHTML = '';
    }
  });
}

function findData() {
  const val = searchInput.value.trim();
  const pageObj = PAGES.find(p => p.name.toLowerCase() === val.toLowerCase());
  
  if (!val || !pageObj) {
    showNotification('Please select a valid page from the suggestions', 'error');
    return;
  }
  
  selectedPage = pageObj.name;
  currentPageObj = pageObj;
  sessionStorage.setItem('currentPage', selectedPage);
  
  // Redirect to dashboard
  window.location.href = 'dashboard.html';
}

// =============================================
// SUPABASE DATA FUNCTIONS
// =============================================

async function searchPlayers(searchTerm) {
  if (!searchTerm || searchTerm.length < 2) return [];
  
  try {
    const { data, error } = await supabase
      .from('latest_status')
      .select('player_name, page_name')
      .ilike('player_name', `%${searchTerm}%`)
      .limit(50);
    
    if (error) throw error;
    
    const uniqueResults = [];
    const seen = new Set();
    
    data.forEach(result => {
      const key = `${result.player_name}||${result.page_name}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueResults.push({
          name: result.player_name,
          page: result.page_name,
          displayName: `${result.player_name} - ${result.page_name}`
        });
      }
    });
    
    uniqueResults.sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) return nameCompare;
      return a.page.localeCompare(b.page);
    });
    
    return uniqueResults;
  } catch (error) {
    console.error('Error searching players:', error);
    showNotification('Error searching players', 'error');
    return [];
  }
}
