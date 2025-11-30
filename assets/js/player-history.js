// =============================================
// PLAYER HISTORY PAGE FUNCTIONS
// =============================================

// DOM Elements
const pageTitle = document.getElementById('pageTitle');
const refreshBtn = document.getElementById('refreshDataBtn');
const forceCleanupBtn = document.getElementById('forceCleanupBtn');
const changePageBtn = document.getElementById('changePageBtn');
const refreshModal = document.getElementById('refreshModal');
const cleanupModal = document.getElementById('cleanupModal');
const refreshPinInput = document.getElementById('refreshPinInput');
const cleanupPinInput = document.getElementById('cleanupPinInput');
const playerSearchInput = document.getElementById('playerSearch');
const playerHistoryContainer = document.getElementById('playerHistoryContainer');

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
  initializePage();
});

function initializePage() {
  const savedPage = sessionStorage.getItem('currentPage');
  
  if (!savedPage) {
    window.location.href = 'index.html';
    return;
  }
  
  selectedPage = savedPage;
  const pageObj = PAGES.find(p => p.name === savedPage);
  if (pageObj) {
    currentPageObj = pageObj;
    updatePageTitle();
  } else {
    window.location.href = 'index.html';
  }
  
  setupEventListeners();
}

function setupEventListeners() {
  // Modal event listeners
  refreshPinInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      confirmRefresh();
    }
  });

  cleanupPinInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      confirmForceCleanup();
    }
  });

  // Player search input listener
  playerSearchInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      findPlayerForCurrentPage();
    }
  });

  window.addEventListener('click', function(event) {
    if (event.target === refreshModal) {
      hideRefreshModal();
    }
    if (event.target === cleanupModal) {
      hideCleanupModal();
    }
  });
}

async function findPlayerForCurrentPage() {
  const playerName = playerSearchInput.value.trim();
  if (!playerName) {
    showNotification('Please enter a player name', 'error');
    return;
  }
  
  sessionStorage.setItem('currentSearchedPlayer', playerName);
  tableState.history.page = 1;
  
  playerHistoryContainer.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div class="spinner"></div>
      <p style="margin-top: 1rem; color: var(--text-secondary);">Loading enhanced player history for <strong>${playerName}</strong>...</p>
    </div>
  `;
  
  try {
    const players = await searchPlayers(playerName);
    if (players && players.length > 0) {
      const currentPagePlayers = players.filter(player => 
        player.page === selectedPage && player.name === playerName
      );
      
      if (currentPagePlayers.length > 0) {
        const player = currentPagePlayers[0];
        await showEnhancedPlayerHistoryForCurrentPage(player.name, selectedPage);
      } else {
        playerHistoryContainer.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: var(--danger);">
            <p><strong>Player "${playerName}" not found on ${selectedPage}</strong></p>
            <p style="margin-top: 1rem; color: var(--text-secondary);">Please try searching for a different player or check the spelling/capitalization.</p>
            <p style="margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
              Note: Player names are case-sensitive. "Gone Reed" and "GOne Reed" are different players.
            </p>
          </div>
        `;
      }
    } else {
      playerHistoryContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--danger);">
          <p><strong>Player "${playerName}" not found</strong></p>
          <p style="margin-top: 1rem; color: var(--text-secondary);">Please try searching for a different player.</p>
        </div>
      `;
    }
  } catch (error) {
    playerHistoryContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--danger);">
        <p><strong>Error searching player: ${error}</strong></p>
        <p style="margin-top: 1rem; color: var(--text-secondary);">Please try again.</p>
      </div>
    `;
  }
}

async function showEnhancedPlayerHistoryForCurrentPage(playerName, pageName) {
  const searchedPlayerName = sessionStorage.getItem('currentSearchedPlayer') || playerName;
  
  playerHistoryContainer.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div class="spinner"></div>
      <p style="margin-top: 1rem; color: var(--text-secondary);">Loading enhanced player history for <strong>${searchedPlayerName}</strong>...</p>
    </div>
  `;
  
  try {
    const data = await getEnhancedPlayerHistory(playerName, pageName);
    renderEnhancedPlayerHistory(data, searchedPlayerName, pageName, false);
  } catch (error) {
    playerHistoryContainer.innerHTML = 
      `<div style="text-align: center; padding: 2rem; color: var(--danger);">
        <p><strong>Error loading enhanced history for ${searchedPlayerName}</strong></p>
        <p style="margin-top: 1rem; color: var(--text-secondary);">${error}</p>
      </div>`;
  }
}

function renderEnhancedPlayerHistory(data, playerName, pageName, isGlobal = false) {
  const container = playerHistoryContainer;
  
  if (!data.enhancedHistory || data.enhancedHistory.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
        <p>${data.message || "No enhanced history available for this player."}</p>
      </div>
    `;
    return;
  }

  const pageObj = PAGES.find(p => p.name === pageName);
  const pageEmoji = pageObj ? pageObj.emoji : '📄';
  const currentStatus = data.currentStatus || "Unknown";
  const isCurrentlyActive = currentStatus === "Active";

  const reversedHistory = [...data.enhancedHistory].reverse();
  const totalEntries = reversedHistory.length;
  const startIndex = (tableState.history.page - 1) * PLAYERS_PER_PAGE;
  const endIndex = Math.min(startIndex + PLAYERS_PER_PAGE, totalEntries);
  const paginatedHistory = reversedHistory.slice(startIndex, endIndex);

  let html = `
    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid var(--border-color);">
      <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem; font-weight: 500;">
        <i class="fas fa-layer-group"></i> Player on Current Page:
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 1.2rem;">${pageEmoji}</span>
        <span style="font-weight: 600; color: var(--text-primary);">${pageName}</span>
      </div>
      <div style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-primary);">
        <i class="fas fa-user"></i> Player: <strong>${playerName}</strong>
      </div>
    </div>
    
    <div class="current-status ${isCurrentlyActive ? 'status-active-bg' : 'status-inactive-bg'}">
      <i class="fas ${isCurrentlyActive ? 'fa-check-circle' : 'fa-times-circle'}"></i>
      Player is currently ${currentStatus} on ${pageName}
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
        <div style="font-size: 0.875rem; color: var(--text-secondary);">Total Deposits</div>
        <div style="font-size: 1.5rem; font-weight: 600; color: var(--text-primary);">${data.rawDeposits || 0}</div>
      </div>
      <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
        <div style="font-size: 0.875rem; color: var(--text-secondary);">Deposit Days</div>
        <div style="font-size: 1.5rem; font-weight: 600; color: var(--text-primary);">${data.totalDepositDays || 0}</div>
      </div>
      <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
        <div style="font-size: 0.875rem; color: var(--text-secondary);">Time Since Last</div>
        <div style="font-size: 1rem; font-weight: 600; color: var(--text-primary);">${data.timeSinceDisplay || 'N/A'}</div>
      </div>
      <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
        <div style="font-size: 0.875rem; color: var(--text-secondary);">Total Amount</div>
        <div style="font-size: 1rem; font-weight: 600; color: var(--text-primary);">$${(data.totalAmount || 0).toFixed(2)}</div>
      </div>
    </div>
    
    <div class="table-container">
      <div class="table-header">
        <h3 class="table-title">Complete Activity Timeline (Latest First) - Showing ALL Deposits</h3>
        <div class="pagination-controls">
          <div class="pagination-info">
            Showing ${startIndex + 1}-${endIndex} of ${totalEntries} periods
          </div>
          <div class="pagination-buttons" id="historyPaginationContainer"></div>
        </div>
      </div>
      <div class="table-scroll-container">
        <table class="enhanced-history-table">
          <thead>
            <tr>
              <th style="text-align: left;">Date / Period</th>
              <th style="text-align: left;">Activity Details</th>
              <th style="text-align: center;">Status</th>
              <th style="text-align: center;">Inactive Gap</th>
              <th style="text-align: left;">Activity Level</th>
            </tr>
          </thead>
          <tbody>
  `;

  paginatedHistory.forEach(period => {
    const isActive = period.status === 'Active';
    const rowClass = isActive ? 'active-row' : 'inactive-row';
    const statusBadge = isActive ? 
      '<span class="status-badge status-active">Active</span>' : 
      '<span class="status-badge status-inactive">Inactive</span>';
    
    let gapDisplay = '-';
    let gapClass = '';
    
    if (period.inactiveGap > 0) {
      gapDisplay = `${period.inactiveGap} day${period.inactiveGap > 1 ? 's' : ''}`;
      if (period.inactiveGap >= 7) gapClass = 'gap-high';
      else if (period.inactiveGap >= 4) gapClass = 'gap-medium';
      else gapClass = 'gap-low';
    }

    let activityDisplay = period.activity;
    if (isActive && period.depositCount > 0) {
      const amountText = period.totalAmount > 0 ? ` - $${period.totalAmount.toFixed(2)}` : '';
      activityDisplay = `${period.depositCount} deposit${period.depositCount > 1 ? 's' : ''}${amountText}`;
    }

    html += `
      <tr class="${rowClass}">
        <td class="date-range-cell" style="text-align: left;">${period.dateRange}</td>
        <td style="text-align: left;">
          <div style="font-weight: 500;">${activityDisplay}</div>
          ${isActive && period.depositCount > 1 ? 
            `<div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
              <i class="fas fa-coins"></i> Multiple transactions this day
            </div>` : ''
          }
        </td>
        <td style="text-align: center;">${statusBadge}</td>
        <td class="gap-cell" style="text-align: center;"><span class="${gapClass}">${gapDisplay}</span></td>
        <td style="text-align: left;">
          ${period.activityLevel === 'Multiple' ? 
            '<span style="color: var(--success);"><i class="fas fa-bolt"></i> High Activity</span>' :
           period.activityLevel === 'Single' ? 
            '<span style="color: var(--info);"><i class="fas fa-check"></i> Normal</span>' :
            '<span style="color: var(--text-secondary);"><i class="fas fa-moon"></i> No Activity</span>'
          }
        </td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;

  const paginationContainer = document.getElementById('historyPaginationContainer');
  renderPagination(totalEntries, tableState.history.page, PLAYERS_PER_PAGE, paginationContainer, 'changeHistoryPage');
}

function changeHistoryPage(page) {
  tableState.history.page = page;
  const playerName = sessionStorage.getItem('currentSearchedPlayer');
  showEnhancedPlayerHistoryForCurrentPage(playerName, selectedPage);
}

function backToDashboard() {
  window.location.href = 'dashboard.html';
}

function backToLanding() {
  sessionStorage.removeItem('currentPage');
  window.location.href = 'index.html';
}

// Modal functions
function showRefreshModal() {
  if (refreshBtn.disabled) return;
  refreshPinInput.value = '';
  refreshModal.style.display = 'block';
  refreshPinInput.focus();
}

function hideRefreshModal() {
  refreshModal.style.display = 'none';
  refreshPinInput.value = '';
}

function showCleanupModal() {
  if (forceCleanupBtn.disabled) return;
  cleanupPinInput.value = '';
  cleanupModal.style.display = 'block';
  cleanupPinInput.focus();
}

function hideCleanupModal() {
  cleanupModal.style.display = 'none';
  cleanupPinInput.value = '';
}

// Updated refresh function
async function confirmRefresh() {
  const pin = refreshPinInput.value.trim();
  if (!pin) {
    showNotification('Please enter PIN', 'error');
    return;
  }
  
  if (pin !== AUTH_PIN) {
    showNotification('Invalid PIN', 'error');
    return;
  }
  
  hideRefreshModal();
  disableControlButtons();
  refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
  showLoader();
  
  try {
    const { data, error } = await supabase.rpc('refresh_player_status', {});
    
    if (error) throw error;
    
    if (data && data.success) {
      showNotification(data.message, 'success');
      // Clear current search results
      playerHistoryContainer.innerHTML = '';
      playerSearchInput.value = '';
    } else {
      showNotification('Refresh failed: ' + (data?.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    showNotification('Error refreshing data: ' + error.message, 'error');
  } finally {
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data';
    enableControlButtons();
  }
}

async function confirmForceCleanup() {
  const pin = cleanupPinInput.value.trim();
  if (!pin) {
    showNotification('Please enter PIN', 'error');
    return;
  }
  
  if (pin !== AUTH_PIN) {
    showNotification('Invalid PIN', 'error');
    return;
  }
  
  hideCleanupModal();
  disableControlButtons();
  forceCleanupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cleaning...';
  showLoader();
  
  try {
    const { data, error } = await supabase.rpc('force_cleanup', {});
    
    if (error) throw error;
    
    if (data && data.success) {
      showNotification(data.message, 'warning');
      // Clear current search results
      playerHistoryContainer.innerHTML = '';
      playerSearchInput.value = '';
    } else {
      showNotification('Cleanup failed: ' + (data?.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    showNotification('Error during cleanup: ' + error.message, 'error');
  } finally {
    forceCleanupBtn.innerHTML = '<i class="fas fa-broom"></i> Force Cleanup';
    enableControlButtons();
  }
}

// =============================================
// SUPABASE DATA FUNCTIONS - COMPLETE
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

// FIXED: Enhanced Player History Function with proper PKT timezone handling
async function getEnhancedPlayerHistory(playerName, pageName) {
  try {
    const { data, error } = await supabase
      .from('deposits')
      .select('deposit_date, amount')
      .eq('player_name', playerName)
      .eq('page_name', pageName)
      .order('deposit_date', { ascending: true });
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return { 
        enhancedHistory: [], 
        activityNotes: ["No data found for this player."],
        currentStatus: "Inactive",
        message: "No data found for this player",
        rawDeposits: 0,
        timeSinceDisplay: "N/A"
      };
    }

    // Process ALL deposits and convert to PKT for display
    const playerDeposits = data.map(deposit => {
      const utcDate = new Date(deposit.deposit_date);
      
      // Convert to PKT for display (UTC+5)
      const pktDate = new Date(utcDate.getTime() + (5 * 60 * 60 * 1000));
      const displayDate = convertUTCToPKT(deposit.deposit_date);
      const displayDateOnly = convertUTCToPKTDateOnly(deposit.deposit_date);
      
      return {
        utcDate: utcDate,
        pktDate: pktDate, // Store PKT date for calculations
        timestamp: displayDate,
        displayDateOnly: displayDateOnly,
        amount: parseFloat(deposit.amount) || 0,
        originalDate: deposit.deposit_date
      };
    }).filter(deposit => !isNaN(deposit.utcDate.getTime()));

    playerDeposits.sort((a, b) => a.pktDate - b.pktDate); // Sort by PKT date
    
    // Get current time in PKT for calculations
    const nowPKT = getCurrentPKT();
    const mostRecentDeposit = playerDeposits[playerDeposits.length - 1];
    
    // Calculate time since using PKT dates
    const timeSinceMs = nowPKT - mostRecentDeposit.pktDate;
    const hoursSince = Math.floor(timeSinceMs / (1000 * 60 * 60));
    const minutesSince = Math.floor((timeSinceMs % (1000 * 60 * 60)) / (1000 * 60));
    const daysSince = hoursSince / 24;
    const remainingHours = hoursSince % 24;
    
    const currentStatus = daysSince <= DAYS_ACTIVE ? "Active" : "Inactive";

    let timeSinceDisplay = '';
    if (daysSince < 1) {
      if (hoursSince === 0) {
        timeSinceDisplay = `${minutesSince} minutes ago`;
      } else {
        timeSinceDisplay = `${hoursSince} hours ${minutesSince} minutes ago`;
      }
    } else {
      const fullDays = Math.floor(daysSince);
      timeSinceDisplay = `${fullDays} day${fullDays > 1 ? 's' : ''} ${remainingHours} hours ago`;
    }

    // Group deposits by PKT date for display
    const depositsByDay = {};
    playerDeposits.forEach(deposit => {
      const dateKey = deposit.displayDateOnly;
      
      if (!depositsByDay[dateKey]) {
        depositsByDay[dateKey] = {
          count: 0,
          totalAmount: 0,
          displayDate: dateKey,
          deposits: [],
          pktDate: deposit.pktDate
        };
      }
      depositsByDay[dateKey].count++;
      depositsByDay[dateKey].totalAmount += deposit.amount;
      depositsByDay[dateKey].deposits.push(deposit);
    });

    // Create enhanced history
    const enhancedHistory = [];
    const depositDates = Object.keys(depositsByDay).sort((a, b) => {
      return new Date(depositsByDay[a].pktDate) - new Date(depositsByDay[b].pktDate);
    });
    
    if (depositDates.length === 0) {
      return {
        enhancedHistory: [],
        currentStatus: "Inactive",
        message: "No deposit data available",
        rawDeposits: 0,
        timeSinceDisplay: "N/A"
      };
    }

    // Get the earliest and latest deposit dates in PKT
    const firstDepositDate = new Date(playerDeposits[0].pktDate);
    const lastDepositDate = new Date(playerDeposits[playerDeposits.length - 1].pktDate);
    
    // Create timeline from first deposit to today in PKT
    let currentDate = new Date(firstDepositDate);
    currentDate.setUTCHours(0, 0, 0, 0);
    
    const todayPKT = getStartOfDayPKT(nowPKT);
    
    const timeline = [];
    
    // Generate all days from first deposit to today in PKT
    while (currentDate <= todayPKT) {
      const dateKey = convertUTCToPKTDateOnly(currentDate.toISOString());
      const dayData = depositsByDay[dateKey];
      
      timeline.push({
        date: new Date(currentDate),
        dateKey: dateKey,
        isDepositDay: !!dayData,
        depositCount: dayData ? dayData.count : 0,
        totalAmount: dayData ? dayData.totalAmount : 0,
        displayDate: dateKey,
        deposits: dayData ? dayData.deposits : [],
        pktDate: currentDate.getTime()
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setUTCHours(0, 0, 0, 0);
    }

    console.log(`Player ${playerName} timeline:`, {
      firstDeposit: firstDepositDate.toISOString(),
      lastDeposit: lastDepositDate.toISOString(),
      todayPKT: todayPKT.toISOString(),
      timelineDays: timeline.length,
      depositsByDay: depositsByDay
    });

    // Group consecutive days with same activity status
    let i = 0;
    while (i < timeline.length) {
      const currentDay = timeline[i];
      
      if (currentDay.isDepositDay) {
        // This is a deposit day - create an entry for it
        const depositText = currentDay.depositCount === 1 
          ? "1 deposit" 
          : `${currentDay.depositCount} deposits`;
        
        const amountText = currentDay.totalAmount > 0 
          ? ` ($${currentDay.totalAmount.toFixed(2)})` 
          : "";
        
        enhancedHistory.push({
          dateRange: currentDay.displayDate,
          activity: `${depositText}${amountText}`,
          status: "Active",
          inactiveGap: 0,
          activityLevel: currentDay.depositCount > 1 ? "Multiple" : "Single",
          depositCount: currentDay.depositCount,
          totalAmount: currentDay.totalAmount,
          isDepositDay: true,
          timestamp: currentDay.pktDate
        });
        i++;
      } else {
        // This is an inactive day - find consecutive inactive days
        let inactiveStart = i;
        let inactiveCount = 0;
        
        while (i < timeline.length && !timeline[i].isDepositDay) {
          inactiveCount++;
          i++;
        }
        
        if (inactiveCount === 1) {
          // Single inactive day
          enhancedHistory.push({
            dateRange: timeline[inactiveStart].displayDate,
            activity: "No deposits",
            status: "Inactive",
            inactiveGap: inactiveCount,
            activityLevel: "None",
            depositCount: 0,
            totalAmount: 0,
            isDepositDay: false,
            timestamp: timeline[inactiveStart].pktDate
          });
        } else {
          // Multiple consecutive inactive days
          const startDate = timeline[inactiveStart].displayDate;
          const endDate = timeline[i - 1].displayDate;
          enhancedHistory.push({
            dateRange: `${startDate} - ${endDate}`,
            activity: "No deposits",
            status: "Inactive",
            inactiveGap: inactiveCount,
            activityLevel: "None",
            depositCount: 0,
            totalAmount: 0,
            isDepositDay: false,
            timestamp: timeline[inactiveStart].pktDate
          });
        }
      }
    }

    const totalDepositDays = Object.keys(depositsByDay).length;
    const totalDepositCount = playerDeposits.length;
    const totalAmount = playerDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);

    return {
      enhancedHistory: enhancedHistory,
      currentStatus: currentStatus,
      rawDeposits: totalDepositCount,
      totalDepositDays: totalDepositDays,
      totalAmount: totalAmount,
      timeSinceDisplay: timeSinceDisplay,
      message: `Found ${totalDepositCount} deposit(s) across ${totalDepositDays} day(s) from ${depositDates[0]} to ${depositDates[depositDates.length - 1]}`
    };
  } catch (error) {
    console.error('Error getting enhanced player history:', error);
    return { 
      enhancedHistory: [], 
      currentStatus: "Inactive",
      message: "Error loading player history",
      rawDeposits: 0,
      timeSinceDisplay: "N/A"
    };
  }
}
