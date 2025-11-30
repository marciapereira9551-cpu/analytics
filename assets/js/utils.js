// =============================================
// TIME CONVERSION UTILITIES - FIXED FOR PAKISTAN TIME
// =============================================

// Convert UTC to Pakistan Time (UTC+5) for display only
function convertUTCToPKT(utcDateString) {
    if (!utcDateString) return 'N/A';
    
    try {
        const date = new Date(utcDateString);
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', utcDateString);
            return 'Invalid Date';
        }
        
        // Convert to Pakistan Time (UTC+5)
        const pktOffset = 5 * 60 * 60 * 1000;
        const pktDate = new Date(date.getTime() + pktOffset);
        
        const day = String(pktDate.getUTCDate()).padStart(2, '0');
        const month = String(pktDate.getUTCMonth() + 1).padStart(2, '0');
        const year = pktDate.getUTCFullYear();
        
        let hours = pktDate.getUTCHours();
        const minutes = String(pktDate.getUTCMinutes()).padStart(2, '0');
        const seconds = String(pktDate.getUTCSeconds()).padStart(2, '0');
        
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hours12 = String(hours).padStart(2, '0');
        
        return `${day}/${month}/${year}, ${hours12}:${minutes}:${seconds} ${ampm}`;
    } catch (error) {
        console.error('Error converting date to PKT:', error, utcDateString);
        return 'Date Error';
    }
}

// Convert UTC to Pakistan Time date only (DD/MM/YYYY)
function convertUTCToPKTDateOnly(utcDateString) {
    if (!utcDateString) return 'N/A';
    
    try {
        const date = new Date(utcDateString);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        
        const pktOffset = 5 * 60 * 60 * 1000;
        const pktDate = new Date(date.getTime() + pktOffset);
        
        const day = String(pktDate.getUTCDate()).padStart(2, '0');
        const month = String(pktDate.getUTCMonth() + 1).padStart(2, '0');
        const year = pktDate.getUTCFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error converting date to PKT:', error);
        return 'Date Error';
    }
}

// Get current time in Pakistan Time
function getCurrentPKT() {
    const now = new Date();
    const pktOffset = 5 * 60 * 60 * 1000;
    return new Date(now.getTime() + pktOffset);
}

// Format date as YYYY-MM-DD for grouping (using PKT timezone)
function formatDateForGrouping(pktDate) {
    if (!pktDate) return '';
    const year = pktDate.getUTCFullYear();
    const month = String(pktDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(pktDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get start of day in PKT (00:00:00)
function getStartOfDayPKT(date) {
    const pktDate = new Date(date);
    pktDate.setUTCHours(0, 0, 0, 0);
    return pktDate;
}

// Calculate time since last deposit in PKT
function formatTimeSince(utcDateString) {
    if (!utcDateString) return 'N/A';
    
    try {
        const nowPKT = getCurrentPKT();
        const lastDepositUTC = new Date(utcDateString);
        const lastDepositPKT = new Date(lastDepositUTC.getTime() + (5 * 60 * 60 * 1000));
        
        if (isNaN(nowPKT.getTime()) || isNaN(lastDepositPKT.getTime())) {
            return 'N/A';
        }
        
        const diffMs = nowPKT - lastDepositPKT;
        
        if (diffMs < 0) {
            return 'Just now';
        }
        
        const hoursSince = Math.floor(diffMs / (1000 * 60 * 60));
        const minutesSince = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const daysSince = hoursSince / 24;
        const remainingHours = hoursSince % 24;
        
        if (daysSince < 1) {
            if (hoursSince === 0) {
                return `${minutesSince} minutes ago`;
            } else {
                return `${hoursSince} hours ${minutesSince} minutes ago`;
            }
        } else {
            const fullDays = Math.floor(daysSince);
            return `${fullDays} day${fullDays > 1 ? 's' : ''} ${remainingHours} hours ago`;
        }
    } catch (error) {
        console.error('Error calculating time since:', error, utcDateString);
        return 'N/A';
    }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

function normalizePageName(pageName) {
  if (!pageName || typeof pageName !== 'string') return pageName;
  
  const trimmedName = pageName.trim();
  const lowerName = trimmedName.toLowerCase();
  
  if (PAGE_NAME_MAP[lowerName]) {
    return PAGE_NAME_MAP[lowerName];
  }
  
  return lowerName
    .split(' ')
    .map(word => {
      if (word === '2.0') return '2.0';
      if (word === 't') return 'T';
      if (word === 'vblink') return 'VBlink';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/\s+\+\s+/g, '+')
    .replace(/Egames/g, 'E-Games');
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 5000);
}

function getPaginatedPlayers(players, page, pageSize) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return players.slice(startIndex, endIndex);
}

function renderPagination(totalPlayers, currentPage, pageSize, container, onPageChange) {
  const totalPages = Math.ceil(totalPlayers / pageSize);
  
  if (totalPages <= 1) return '';
  
  let html = `
    <div class="pagination-buttons">
  `;
  
  html += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="${onPageChange}(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
          </button>`;
  
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="${onPageChange}(${i})">${i}</button>`;
  }
  
  html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="${onPageChange}(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
          </button>`;
  
  html += `</div>`;
  
  container.innerHTML = html;
}

function showLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'block';
}

function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';
}

function disableControlButtons() {
  const changePageBtn = document.getElementById('changePageBtn');
  const refreshBtn = document.getElementById('refreshDataBtn');
  const forceCleanupBtn = document.getElementById('forceCleanupBtn');
  
  if (changePageBtn) changePageBtn.disabled = true;
  if (refreshBtn) refreshBtn.disabled = true;
  if (forceCleanupBtn) forceCleanupBtn.disabled = true;
}

function enableControlButtons() {
  const changePageBtn = document.getElementById('changePageBtn');
  const refreshBtn = document.getElementById('refreshDataBtn');
  const forceCleanupBtn = document.getElementById('forceCleanupBtn');
  
  if (changePageBtn) changePageBtn.disabled = false;
  if (refreshBtn) refreshBtn.disabled = false;
  if (forceCleanupBtn) forceCleanupBtn.disabled = false;
}

function updatePageTitle() {
  const pageTitle = document.getElementById('pageTitle');
  if (currentPageObj && pageTitle) {
    pageTitle.textContent = `${currentPageObj.name} ${currentPageObj.emoji} - Analytics Dashboard`;
  } else if (selectedPage && pageTitle) {
    const pageObj = PAGES.find(p => p.name === selectedPage);
    if (pageObj) {
      currentPageObj = pageObj;
      pageTitle.textContent = `${pageObj.name} ${pageObj.emoji} - Analytics Dashboard`;
    } else {
      pageTitle.textContent = `${selectedPage} - Analytics Dashboard`;
    }
  }
}

// Theme detection
function detectTheme() {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

// Initialize theme detection
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectTheme);
detectTheme();
