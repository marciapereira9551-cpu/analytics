// =============================================
// DASHBOARD FUNCTIONS
// =============================================

// DOM Elements
const pageTitle = document.getElementById('pageTitle');
const refreshBtn = document.getElementById('refreshDataBtn');
const forceCleanupBtn = document.getElementById('forceCleanupBtn');
const changePageBtn = document.getElementById('changePageBtn');
const loadingProgress = document.getElementById('loadingProgress');
const refreshModal = document.getElementById('refreshModal');
const cleanupModal = document.getElementById('cleanupModal');
const refreshPinInput = document.getElementById('refreshPinInput');
const cleanupPinInput = document.getElementById('cleanupPinInput');
const statsRow1 = document.getElementById('statsRow1');
const statsRow2 = document.getElementById('statsRow2');
const statsRow3 = document.getElementById('statsRow3');

let progressInterval = null;

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
  initializeDashboard();
});

function initializeDashboard() {
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
    loadDashboardData();
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

  window.addEventListener('click', function(event) {
    if (event.target === refreshModal) {
      hideRefreshModal();
    }
    if (event.target === cleanupModal) {
      hideCleanupModal();
    }
  });
}

async function loadDashboardData() {
  if (!selectedPage) return;
  
  showLoader();
  disableControlButtons();
  
  try {
    const data = await getPageActivity(selectedPage);
    handleDashboardData(data);
  } catch (error) {
    handleDataError(error);
  }
}

function handleDashboardData(data) {
  hideLoader();
  currentPageData = data;
  renderDashboard(data);
  enableControlButtons();
}

function handleDataError(error) {
  hideLoader();
  showNotification('Error loading data: ' + error, 'error');
  enableControlButtons();
}

function renderDashboard(data) {
  currentPageData = data;

  const dash = document.getElementById('dashboardBoxes');
  dash.style.display = 'block';

  statsRow1.innerHTML = "";
  statsRow2.innerHTML = "";
  statsRow3.innerHTML = "";

  const firstRowBoxes = [
    { label: "Total Players", value: data.counts.Total || 0, type: "Total", icon: "fas fa-users", colorClass: "total", link: "total-players.html" },
    { label: "Active Players", value: data.counts.Active || 0, type: "Active", icon: "fas fa-user-check", colorClass: "active", link: "active.html" },
    { label: "Inactive Players", value: data.counts.Inactive || 0, type: "Inactive", icon: "fas fa-user-times", colorClass: "inactive", link: "inactive.html" }
  ];

  const secondRowBoxes = [
    { label: "Recent Active", value: data.counts.RecentActive || 0, type: "RecentActive", icon: "fas fa-bolt", colorClass: "recent-active", link: "recent-active.html" },
    { label: "Recent Inactive", value: data.counts.RecentInactive || 0, type: "RecentInactive", icon: "fas fa-clock", colorClass: "recent-inactive", link: "recent-inactive.html" },
    { label: "High Risk Players", value: data.counts.HighRisk || 0, type: "HighRisk", icon: "fas fa-exclamation-triangle", colorClass: "high-risk", link: "high-risk.html" }
  ];

  const thirdRowBoxes = [
    { label: "Player History", value: "", type: "PlayerHistory", icon: "fas fa-history", colorClass: "history", link: "player-history.html" },
    { label: "Page Deposits", value: "", type: "PageDeposits", icon: "fas fa-money-bill-wave", colorClass: "deposits", link: "page-deposits.html" },
    { label: "Coming Soon", value: "", type: "ComingSoon2", icon: "fas fa-cogs", colorClass: "coming-soon", link: "#" }
  ];

  firstRowBoxes.forEach(b => {
    const div = document.createElement('div');
    div.className = `stat-card ${b.colorClass}`;

    let displayValue = (b.value === "" || b.value === undefined || b.value === null) ? 0 : b.value;

    div.innerHTML = `
      <div class="stat-icon">
        <i class="${b.icon}"></i>
      </div>
      <div class="stat-value">${displayValue}</div>
      <div class="stat-label">${b.label}</div>
    `;

    div.onclick = () => window.location.href = b.link;
    statsRow1.appendChild(div);
  });

  secondRowBoxes.forEach(b => {
    const div = document.createElement('div');
    div.className = `stat-card ${b.colorClass}`;

    let displayValue = (b.value === "" || b.value === undefined || b.value === null) ? 0 : b.value;

    div.innerHTML = `
      <div class="stat-icon">
        <i class="${b.icon}"></i>
      </div>
      <div class="stat-value">${displayValue}</div>
      <div class="stat-label">${b.label}</div>
    `;

    div.onclick = () => window.location.href = b.link;
    statsRow2.appendChild(div);
  });

  thirdRowBoxes.forEach(b => {
    const div = document.createElement('div');
    div.className = `stat-card ${b.colorClass}`;

    let displayValue = (b.type === "PlayerHistory" || b.type === "PageDeposits" || b.type.startsWith("ComingSoon")) ? "" : (b.value === "" || b.value === undefined || b.value === null) ? 0 : b.value;

    let comingSoonBadge = '';
    if (b.type.startsWith("ComingSoon")) {
      comingSoonBadge = '<div class="coming-soon-badge">Coming Soon</div>';
    }

    div.innerHTML = `
      ${comingSoonBadge}
      <div class="stat-icon">
        <i class="${b.icon}"></i>
      </div>
      <div class="stat-value">${displayValue}</div>
      <div class="stat-label">
        ${b.label}
      </div>
    `;

    if (b.type.startsWith("ComingSoon")) {
      div.onclick = () => showNotification('This feature is coming soon!', 'warning');
    } else {
      div.onclick = () => window.location.href = b.link;
    }
    statsRow3.appendChild(div);
  });
}

function backToLanding() {
  sessionStorage.removeItem('currentPage');
  window.location.href = 'index.html';
}

function showLoadingProgress() {
  const progressMessages = [
    "Loading player data...",
    "Calculating deposits...", 
    "Analyzing activity...",
    "Finalizing dashboard..."
  ];
  
  let current = 0;
  loadingProgress.textContent = progressMessages[0];
  
  progressInterval = setInterval(() => {
    current++;
    if (current < progressMessages.length) {
      loadingProgress.textContent = progressMessages[current];
    } else {
      clearInterval(progressInterval);
    }
  }, 800);
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
    // Call refresh_player_status with empty parameters
    const { data, error } = await supabase.rpc('refresh_player_status', {});
    
    if (error) throw error;
    
    if (data && data.success) {
      showNotification(data.message, 'success');
      await loadDashboardData();
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
    // Call force_cleanup with empty parameters
    const { data, error } = await supabase.rpc('force_cleanup', {});
    
    if (error) throw error;
    
    if (data && data.success) {
      showNotification(data.message, 'warning');
      await loadDashboardData();
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
// SUPABASE DATA FUNCTIONS
// =============================================

async function getPageActivity(pageName) {
  try {
    // Get latest status for the page
    const { data: statusData, error: statusError } = await supabase
      .from('latest_status')
      .select('*')
      .eq('page_name', pageName);
    
    if (statusError) throw statusError;
    
    if (!statusData || statusData.length === 0) {
      return getEmptyPageData(pageName);
    }

    // Get deposit data for calculations
    const depositData = await computePlayerDeposits(pageName);
    const playersWithNotes = await getAllPlayersWithNotes(pageName);
    
    // Get status changes for this page to show in activity notes
    const { data: changesData } = await supabase
      .from('status_changes')
      .select('*')
      .eq('page_name', pageName)
      .order('change_date', { ascending: false })
      .limit(100);

    // Create a map of recent status changes per player
    const recentChanges = {};
    if (changesData) {
      changesData.forEach(change => {
        const key = change.player_name;
        if (!recentChanges[key]) {
          recentChanges[key] = change;
        }
      });
    }

    const resultPlayers = [];
    const recentActivePlayers = [];
    const recentInactivePlayers = [];
    
    statusData.forEach(player => {
      const playerName = player.player_name;
      const originalTimestamp = player.last_deposit_date;
      const lastDepositDisplay = convertUTCToPKT(originalTimestamp);
      
      // Calculate days since using UTC dates for consistency
      const nowUTC = new Date();
      const lastDepositUTC = new Date(originalTimestamp);
      const daysSince = Math.floor((nowUTC - lastDepositUTC) / (1000 * 60 * 60 * 24));
      
      const status = player.status || "Inactive";
      
      const playerDeposits = depositData[playerName] || { total: 0, last7Days: 0 };
      
      // Enhanced activity notes with status change info
      let activityNotes = player.activity_notes || "";
      const recentChange = recentChanges[playerName];
      if (recentChange) {
        activityNotes += ` | Last status change: ${recentChange.old_status} → ${recentChange.new_status} on ${convertUTCToPKT(recentChange.change_date)}`;
      }
      
      const playerData = {
        player: playerName,
        lastDeposit: lastDepositDisplay,
        originalTimestamp: originalTimestamp,
        daysSince: daysSince,
        status: status,
        totalDeposit: playerDeposits.total,
        last7DaysDeposit: playerDeposits.last7Days,
        activityNotes: activityNotes,
        hasNotes: playersWithNotes[playerName] || false
      };
      
      resultPlayers.push(playerData);
      
      const recentActiveCheck = isRecentActiveOptimized(playerName, depositData);
      if (status === "Active" && recentActiveCheck.isRecentActive) {
        playerData.gapDays = recentActiveCheck.gapDays;
        recentActivePlayers.push(playerData);
      }
      
      if (status === "Inactive" && daysSince >= RECENT_INACTIVE_MIN_DAYS && daysSince < RECENT_INACTIVE_MAX_DAYS) {
        recentInactivePlayers.push(playerData);
      }
    });

    const highRiskData = await getHighRiskPlayers(pageName);
    const highRiskPlayers = highRiskData.highRiskPlayers || [];

    highRiskPlayers.forEach(player => {
      player.hasNotes = playersWithNotes[player.player] || false;
    });

    // Sort by original timestamp
    resultPlayers.sort((a, b) => new Date(b.originalTimestamp) - new Date(a.originalTimestamp));
    recentActivePlayers.sort((a, b) => new Date(b.originalTimestamp) - new Date(a.originalTimestamp));
    recentInactivePlayers.sort((a, b) => new Date(b.originalTimestamp) - new Date(a.originalTimestamp));
    highRiskPlayers.sort((a, b) => new Date(b.lastDeposit) - new Date(a.lastDeposit));

    const counts = {
      Total: resultPlayers.length,
      Active: resultPlayers.filter(p => p.status === "Active").length,
      Inactive: resultPlayers.filter(p => p.status === "Inactive" && p.daysSince >= INACTIVE_THRESHOLD).length,
      RecentActive: recentActivePlayers.length,
      RecentInactive: recentInactivePlayers.length,
      HighRisk: highRiskPlayers.length
    };

    return { 
      page: pageName, 
      counts, 
      players: resultPlayers, 
      recentActivePlayers, 
      recentInactivePlayers,
      highRiskPlayers: highRiskPlayers
    };
  } catch (error) {
    console.error('Error getting page activity:', error);
    showNotification('Error loading page data', 'error');
    return getEmptyPageData(pageName);
  }
}

function getEmptyPageData(pageName) {
  return {
    page: pageName, 
    counts: { Total: 0, Active: 0, Inactive: 0, RecentActive: 0, RecentInactive: 0, HighRisk: 0 }, 
    players: [], 
    recentActivePlayers: [], 
    recentInactivePlayers: [],
    highRiskPlayers: []
  };
}

async function computePlayerDeposits(pageName) {
  try {
    const { data, error } = await supabase
      .from('deposits')
      .select('player_name, amount, deposit_date')
      .eq('page_name', pageName);
    
    if (error) throw error;
    
    const depositData = {};
    const todayUTC = new Date();
    const sevenDaysAgo = new Date(todayUTC.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    data.forEach(deposit => {
      const playerName = deposit.player_name;
      const amount = parseFloat(deposit.amount) || 0;
      const depositDateUTC = new Date(deposit.deposit_date);
      
      if (!depositData[playerName]) {
        depositData[playerName] = { total: 0, last7Days: 0, deposits: [] };
      }
      
      depositData[playerName].total += amount;
      depositData[playerName].deposits.push(depositDateUTC);
      
      if (depositDateUTC >= sevenDaysAgo) {
        depositData[playerName].last7Days += amount;
      }
    });
    
    return depositData;
  } catch (error) {
    console.error('Error computing player deposits:', error);
    return {};
  }
}

function isRecentActiveOptimized(playerName, depositData) {
  const playerData = depositData[playerName];
  
  if (!playerData || !playerData.deposits || playerData.deposits.length < 2) {
    return { isRecentActive: false, gapDays: null };
  }
  
  const deposits = playerData.deposits.sort((a, b) => b - a);
  
  const latest = deposits[0];
  const secondLatest = deposits[1];
  const gapHours = Math.floor((latest - secondLatest) / (1000 * 60 * 60));
  const gapDays = gapHours / 24;
  
  const todayUTC = new Date();
  const hoursSinceLatest = Math.floor((todayUTC - latest) / (1000 * 60 * 60));
  const daysSinceLatest = hoursSinceLatest / 24;
  
  const isRecentActive = gapDays >= 3 && daysSinceLatest <= DAYS_ACTIVE;
  
  return { 
    isRecentActive: isRecentActive, 
    gapDays: isRecentActive ? Math.floor(gapDays) : null 
  };
}

async function getAllPlayersWithNotes(pageName) {
  try {
    const { data, error } = await supabase
      .from('player_notes')
      .select('player_name')
      .eq('page_name', pageName);
    
    if (error) throw error;
    
    const playersWithNotes = {};
    data.forEach(note => {
      playersWithNotes[note.player_name] = true;
    });
    
    return playersWithNotes;
  } catch (error) {
    console.error('Error getting players with notes:', error);
    return {};
  }
}

async function getHighRiskPlayers(pageName) {
  try {
    const { data, error } = await supabase
      .from('deposits')
      .select('player_name, deposit_date')
      .eq('page_name', pageName);
    
    if (error) throw error;
    
    const playerDeposits = {};
    const todayUTC = new Date();
    const fifteenDaysAgo = new Date(todayUTC.getTime() - (HIGH_RISK_MAX_DAYS * 24 * 60 * 60 * 1000));
    
    data.forEach(deposit => {
      const playerName = deposit.player_name;
      const depositDateUTC = new Date(deposit.deposit_date);
      
      if (!isNaN(depositDateUTC?.getTime()) && depositDateUTC >= fifteenDaysAgo) {
        if (!playerDeposits[playerName]) {
          playerDeposits[playerName] = [];
        }
        playerDeposits[playerName].push(depositDateUTC);
      }
    });

    Object.keys(playerDeposits).forEach(player => {
      playerDeposits[player] = groupDepositsByDay(playerDeposits[player]);
    });

    const highRiskPlayers = [];
    const MIN_GAP_DAYS = 5;

    Object.keys(playerDeposits).forEach(player => {
      const depositsByDay = playerDeposits[player];
      const depositDates = Object.keys(depositsByDay).sort();
      
      if (depositDates.length === 0) return;

      const deposits = depositDates.map(date => {
        const dayData = depositsByDay[date];
        // Use the latest deposit time for that day
        const latestDeposit = dayData.deposits.sort((a, b) => b - a)[0];
        return latestDeposit;
      }).sort((a, b) => a - b);
      
      if (deposits.length === 1) {
        const singleDepositDate = deposits[0];
        const hoursSinceSingleDeposit = Math.floor((todayUTC - singleDepositDate) / (1000 * 60 * 60));
        const daysSinceSingleDeposit = hoursSinceSingleDeposit / 24;
        
        if (daysSinceSingleDeposit >= MIN_GAP_DAYS && daysSinceSingleDeposit < HIGH_RISK_MAX_DAYS) {
          const currentStatus = daysSinceSingleDeposit <= DAYS_ACTIVE ? "Active" : "Inactive";
          
          highRiskPlayers.push({
            player: player,
            gaps: [{
              gapDays: Math.floor(daysSinceSingleDeposit),
              gapBetween: `Single activity day on ${convertUTCToPKTDateOnly(singleDepositDate.toISOString())}`
            }],
            totalQualifyingGaps: 1,
            maxGapDays: Math.floor(daysSinceSingleDeposit),
            lastDeposit: singleDepositDate.toISOString(),
            daysSinceLastDeposit: Math.floor(daysSinceSingleDeposit),
            currentStatus: currentStatus,
            totalDeposits: depositsByDay[depositDates[0]].count,
            riskLevel: calculateRiskLevel(1, Math.floor(daysSinceSingleDeposit)),
            depositType: "single"
          });
        }
        return;
      }
      
      const allGaps = [];
      const qualifyingGaps = [];
      
      for (let i = 0; i < deposits.length - 1; i++) {
        const currentDeposit = deposits[i];
        const nextDeposit = deposits[i + 1];
        const gapHours = Math.floor((nextDeposit - currentDeposit) / (1000 * 60 * 60));
        const gapDays = gapHours / 24;
        allGaps.push(gapDays);
        
        if (gapDays >= MIN_GAP_DAYS && gapDays < HIGH_RISK_MAX_DAYS) {
          qualifyingGaps.push({
            gapDays: Math.floor(gapDays),
            gapBetween: `${convertUTCToPKTDateOnly(currentDeposit.toISOString())} to ${convertUTCToPKTDateOnly(nextDeposit.toISOString())}`
          });
        }
      }
      
      const lastDepositDate = deposits[deposits.length - 1];
      const hoursSinceLastDeposit = Math.floor((todayUTC - lastDepositDate) / (1000 * 60 * 60));
      const daysSinceLastDeposit = hoursSinceLastDeposit / 24;
      
      if (daysSinceLastDeposit >= MIN_GAP_DAYS && daysSinceLastDeposit < HIGH_RISK_MAX_DAYS) {
        qualifyingGaps.push({
          gapDays: Math.floor(daysSinceLastDeposit),
          gapBetween: `${convertUTCToPKTDateOnly(lastDepositDate.toISOString())} to today`
        });
        allGaps.push(daysSinceLastDeposit);
      }
      
      const hasExcessiveGap = allGaps.some(gap => gap >= HIGH_RISK_MAX_DAYS);
      if (hasExcessiveGap) {
        return;
      }
      
      if (qualifyingGaps.length > 0) {
        const currentStatus = daysSinceLastDeposit <= DAYS_ACTIVE ? "Active" : "Inactive";
        const totalDepositCount = depositDates.reduce((sum, date) => sum + depositsByDay[date].count, 0);
        
        highRiskPlayers.push({
          player: player,
          gaps: qualifyingGaps,
          totalQualifyingGaps: qualifyingGaps.length,
          maxGapDays: Math.max(...qualifyingGaps.map(gap => gap.gapDays)),
          lastDeposit: lastDepositDate.toISOString(),
          daysSinceLastDeposit: Math.floor(daysSinceLastDeposit),
          currentStatus: currentStatus,
          totalDeposits: totalDepositCount,
          riskLevel: calculateRiskLevel(qualifyingGaps.length, Math.max(...qualifyingGaps.map(gap => gap.gapDays))),
          depositType: "multiple"
        });
      }
    });

    highRiskPlayers.sort((a, b) => new Date(b.lastDeposit) - new Date(a.lastDeposit));

    return {
      highRiskPlayers: highRiskPlayers,
      message: `Found ${highRiskPlayers.length} high risk players`
    };
  } catch (error) {
    console.error('Error getting high risk players:', error);
    return { highRiskPlayers: [], message: "Error loading high risk players" };
  }
}

// FIXED: Properly group deposits by day without duplicates
function groupDepositsByDay(deposits) {
  const depositsByDay = {};
  
  deposits.forEach(deposit => {
    // Convert UTC to PKT for grouping
    const pktDate = new Date(deposit.getTime() + (5 * 60 * 60 * 1000));
    const dateKey = formatDateForGrouping(pktDate);
    
    if (!depositsByDay[dateKey]) {
      depositsByDay[dateKey] = {
        date: dateKey,
        deposits: [deposit],
        count: 1
      };
    } else {
      depositsByDay[dateKey].deposits.push(deposit);
      depositsByDay[dateKey].count++;
    }
  });
  
  return depositsByDay;
}

function calculateRiskLevel(totalGaps, maxGapDays) {
  if (totalGaps === 1 && maxGapDays < 15) {
    if (maxGapDays >= 12) return "Very High";
    if (maxGapDays >= 10) return "High";
    if (maxGapDays >= 8) return "Medium";
    if (maxGapDays >= 5) return "Low";
  }
  
  if (totalGaps >= 3 || maxGapDays >= 12) {
    return "Very High";
  } else if (totalGaps >= 2 || maxGapDays >= 10) {
    return "High";
  } else if (totalGaps >= 1 && maxGapDays >= 8) {
    return "Medium";
  } else {
    return "Low";
  }
}
