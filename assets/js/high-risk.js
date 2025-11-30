// =============================================
// HIGH RISK PLAYERS PAGE FUNCTIONS
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
const notesModal = document.getElementById('notesModal');
const noteTextInput = document.getElementById('noteTextInput');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const notesModalTitle = document.getElementById('notesModalTitle');
const notesList = document.getElementById('notesList');

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
    loadPageData();
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

  noteTextInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      savePlayerNote();
    }
  });

  window.addEventListener('click', function(event) {
    if (event.target === refreshModal) {
      hideRefreshModal();
    }
    if (event.target === cleanupModal) {
      hideCleanupModal();
    }
    if (event.target === notesModal) {
      hideNotesModal();
    }
  });
}

async function loadPageData() {
  if (!selectedPage) return;
  
  showLoader();
  disableControlButtons();
  
  try {
    const data = await getPageActivity(selectedPage);
    handlePageData(data);
  } catch (error) {
    handleDataError(error);
  }
}

function handlePageData(data) {
  hideLoader();
  currentPageData = data;
  renderTable(data);
  enableControlButtons();
}

function handleDataError(error) {
  hideLoader();
  showNotification('Error loading data: ' + error, 'error');
  enableControlButtons();
}

function renderTable(data) {
  const backDiv = document.getElementById('backContainer');
  const tbl = document.getElementById('tableContainer');
  
  backDiv.innerHTML = '<button class="btn btn-secondary" onclick="backToDashboard()"><i class="fas fa-arrow-left"></i> Back to Dashboard</button>';
  
  const highRiskPlayers = data.highRiskPlayers || [];
  const totalPlayers = highRiskPlayers.length;
  const currentPage = tableState.highRisk.page;
  const paginatedPlayers = getPaginatedPlayers(highRiskPlayers, currentPage, PLAYERS_PER_PAGE);
  
  if (!highRiskPlayers.length) {
    tbl.innerHTML = `<div class='table-container' style='text-align: center; padding: 2rem;'><p>No high risk players found.</p></div>`;
    return;
  }
  
  let html = `
    <div class="table-container">
      <div class="table-header">
        <h3 class="table-title">High Risk Players Analysis (${totalPlayers} total)</h3>
        <div id="paginationContainer"></div>
      </div>
      <div class="table-scroll-container">
        <table class="high-risk-table">
          <thead>
            <tr>
              <th style="text-align: center;">S.No</th>
              <th>Player</th>
              <th>Risk</th>
              <th>Gaps</th>
              <th>Gap Details</th>
              <th>Last Deposit</th>
              <th>Time Since</th>
              <th>Status</th>
              <th>Deposits</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
  `;
  
  paginatedPlayers.forEach((p, index) => {
    const statusClass = p.currentStatus === "Active" ? "status-active" : "status-inactive";
    
    const lastDepositPKT = convertUTCToPKT(p.lastDeposit);
    const gapDisplay = formatTimeSince(p.lastDeposit);
    
    let gapDetails = '';
    p.gaps.forEach((gap, gapIndex) => {
      gapDetails += `
        <div class="gap-item">
          <strong>${gap.gapDays}d</strong>: ${gap.gapBetween}
        </div>
      `;
    });
    
    let riskClass = '';
    if (p.riskLevel === "Very High") riskClass = 'risk-very-high';
    else if (p.riskLevel === "High") riskClass = 'risk-high';
    else if (p.riskLevel === "Medium") riskClass = 'risk-medium';
    else if (p.riskLevel === "Low") riskClass = 'risk-low';
    
    const notesBtnClass = p.hasNotes ? 'notes-btn has-notes' : 'notes-btn';
    const notesBtnIcon = p.hasNotes ? 'fa-sticky-note' : 'fa-plus';
    const notesBtnText = p.hasNotes ? 'Notes' : 'Add';
    
    const serialNumber = (currentPage - 1) * PLAYERS_PER_PAGE + index + 1;
    
    html += `
      <tr>
        <td style="text-align: center;">${serialNumber}</td>
        <td><strong>${p.player}</strong></td>
        <td class="${riskClass}"><strong>${p.riskLevel}</strong></td>
        <td style="text-align: center;">${p.totalQualifyingGaps}</td>
        <td>
          <div class="gap-details-compact">
            ${gapDetails}
          </div>
        </td>
        <td>${lastDepositPKT}</td>
        <td>${gapDisplay}</td>
        <td><span class="status-badge ${statusClass}">${p.currentStatus}</span></td>
        <td style="text-align: center;">${p.totalDeposits}</td>
        <td>
          <button class="${notesBtnClass}" onclick="showNotesModal('${p.player.replace(/'/g, "\\'")}', this)" title="${p.hasNotes ? 'View notes' : 'Add note'}">
            <i class="fas ${notesBtnIcon}"></i> ${notesBtnText}
          </button>
        </td>
      </tr>
    `;
  });
  
  html += `
          </tbody>
        </table>
      </div>
    </div>
    <div style="margin-top: 1.5rem; background: var(--bg-card); padding: 1.5rem; border-radius: 12px; box-shadow: var(--shadow); border: 1px solid var(--border-color);">
      <h4 style="color: var(--text-primary); margin-bottom: 1rem;">Risk Level Explanation</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
        <div><span class="risk-very-high">🔴 Very High</span>: 3+ gaps OR 12+ day gap</div>
        <div><span class="risk-high">🟠 High</span>: 2+ gaps OR 10+ day gap</div>
        <div><span class="risk-medium">🟡 Medium</span>: 1 gap with 8+ days</div>
        <div><span class="risk-low">🟢 Low</span>: Single smaller gaps</div>
      </div>
      <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
        <p style="color: var(--text-primary); font-weight: 500; font-size: 0.9rem;">Note: High Risk players include those with gaps from 5 to 14 days 23 hours 59 minutes. Players with 15+ day gaps are moved to Inactive.</p>
      </div>
    </div>
  `;
  
  tbl.innerHTML = html;
  
  const paginationContainer = document.getElementById('paginationContainer');
  renderPagination(totalPlayers, currentPage, PLAYERS_PER_PAGE, paginationContainer, 'changePage');
}

function changePage(page) {
  tableState.highRisk.page = page;
  renderTable(currentPageData);
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

// Notes Modal Functions
async function showNotesModal(playerName, buttonElement) {
  currentNotesPlayer = playerName;
  currentNotesPlayerName = playerName;
  currentNotesButton = buttonElement;
  
  notesModalTitle.textContent = `Notes for ${playerName}`;
  noteTextInput.value = '';
  
  await loadPlayerNotes(playerName);
  
  notesModal.style.display = 'block';
  noteTextInput.focus();
}

function hideNotesModal() {
  notesModal.style.display = 'none';
  currentNotesPlayer = null;
  currentNotesPlayerName = null;
  currentNotesButton = null;
  noteTextInput.value = '';
}

async function loadPlayerNotes(playerName) {
  notesList.innerHTML = '<div class="no-notes">Loading notes...</div>';
  
  try {
    const result = await getPlayerNotes(selectedPage, playerName);
    if (result.success && result.notes.length > 0) {
      let notesHtml = '';
      result.notes.forEach(note => {
        const formattedDate = convertUTCToPKT(note.timestamp);
        
        notesHtml += `
          <div class="note-item">
            <div class="note-timestamp">
              <i class="fas fa-clock"></i> ${formattedDate}
            </div>
            <div class="note-text">${note.note}</div>
          </div>
        `;
      });
      notesList.innerHTML = notesHtml;
    } else {
      notesList.innerHTML = '<div class="no-notes">No notes yet for this player.</div>';
    }
  } catch (error) {
    notesList.innerHTML = '<div class="no-notes">Error loading notes.</div>';
    console.error('Error loading notes:', error);
  }
}

async function savePlayerNote() {
  const noteText = noteTextInput.value.trim();
  
  if (!noteText) {
    showNotification('Please enter a note before saving', 'error');
    return;
  }
  
  saveNoteBtn.disabled = true;
  saveNoteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  
  try {
    const result = await addPlayerNote(selectedPage, currentNotesPlayer, noteText);
    if (result.success) {
      showNotification('Note saved successfully!', 'success');
      noteTextInput.value = '';
      await loadPlayerNotes(currentNotesPlayer);
      
      if (currentNotesButton) {
        currentNotesButton.innerHTML = '<i class="fas fa-sticky-note"></i> Notes';
        currentNotesButton.className = 'notes-btn has-notes';
      }
      
      updateCurrentPageDataWithNote(currentNotesPlayer);
    } else {
      showNotification('Error saving note: ' + result.message, 'error');
    }
  } catch (error) {
    showNotification('Error saving note: ' + error, 'error');
  } finally {
    saveNoteBtn.disabled = false;
    saveNoteBtn.innerHTML = '<i class="fas fa-save"></i> Save Note';
  }
}

function updateCurrentPageDataWithNote(playerName) {
  if (currentPageData.highRiskPlayers) {
    currentPageData.highRiskPlayers.forEach(player => {
      if (player.player === playerName) {
        player.hasNotes = true;
      }
    });
  }
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
      await loadPageData();
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
      await loadPageData();
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

async function getPlayerNotes(pageName, playerName) {
  try {
    const { data, error } = await supabase
      .from('player_notes')
      .select('*')
      .eq('page_name', pageName)
      .eq('player_name', playerName)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { 
      notes: data.map(note => ({
        timestamp: note.created_at,
        note: note.note_text
      })), 
      success: true 
    };
  } catch (error) {
    console.error('Error getting player notes:', error);
    return { notes: [], success: false };
  }
}

async function addPlayerNote(pageName, playerName, noteText) {
  try {
    const { data, error } = await supabase
      .from('player_notes')
      .insert([
        {
          page_name: pageName,
          player_name: playerName,
          note_text: noteText,
          created_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (error) throw error;
    
    return { 
      success: true, 
      message: "Note added successfully",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error adding player note:', error);
    return { success: false, message: "Error adding note: " + error.toString() };
  }
}
