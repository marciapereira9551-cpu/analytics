// =============================================
// TOTAL PLAYERS PAGE FUNCTIONS
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
  
  const players = data.players;
  const totalPlayers = players.length;
  const currentPage = tableState.playerTables['Total'].page;
  const paginatedPlayers = getPaginatedPlayers(players, currentPage, PLAYERS_PER_PAGE);
  
  if (!players.length) {
    tbl.innerHTML = `<div class='table-container' style='text-align: center; padding: 2rem;'><p>No players found.</p></div>`;
    return;
  }
  
  let html = `
    <div class="table-container">
      <div class="table-header">
        <h3 class="table-title">All Players (${totalPlayers} total)</h3>
        <div id="paginationContainer"></div>
      </div>
      <div class="table-scroll-container">
        <table style="font-size: 0.875rem;">
          <thead>
            <tr>
              <th style="min-width: 50px; text-align: center;">S.No</th>
              <th style="min-width: 120px;">Player</th>
              <th style="min-width: 140px;">Last Deposit</th>
              <th style="min-width: 100px;">Time Since</th>
              <th style="min-width: 80px;">Status</th>
              <th style="min-width: 90px; text-align: center;">Total $</th>
              <th style="min-width: 90px; text-align: center;">Last 7d $</th>
              <th style="min-width: 90px; text-align: center;">Notes</th>
            </tr>
          </thead>
          <tbody>
  `;
  
  paginatedPlayers.forEach((p, index) => {
    const cls = p.status === "Active" ? "status-active" : "status-inactive";
    
    const gapDisplay = formatTimeSince(p.originalTimestamp);
    
    const notesBtnClass = p.hasNotes ? 'notes-btn has-notes' : 'notes-btn';
    const notesBtnIcon = p.hasNotes ? 'fa-sticky-note' : 'fa-plus';
    const notesBtnText = p.hasNotes ? 'Notes' : 'Add';
    
    const serialNumber = (currentPage - 1) * PLAYERS_PER_PAGE + index + 1;
    
    html += `
      <tr>
        <td style="text-align: center;">${serialNumber}</td>
        <td>${p.player}</td>
        <td>${p.lastDeposit}</td>
        <td>${gapDisplay}</td>
        <td><span class="status-badge ${cls}">${p.status}</span></td>
        <td style="text-align: center;">${p.totalDeposit || 0}</td>
        <td style="text-align: center;">${p.last7DaysDeposit || 0}</td>
        <td style="text-align: center;">
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
  `;
  
  tbl.innerHTML = html;
  
  const paginationContainer = document.getElementById('paginationContainer');
  renderPagination(totalPlayers, currentPage, PLAYERS_PER_PAGE, paginationContainer, 'changePage');
}

function changePage(page) {
  tableState.playerTables['Total'].page = page;
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
  currentPageData.players.forEach(player => {
    if (player.player === playerName) {
      player.hasNotes = true;
    }
  });
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
// SUPABASE DATA FUNCTIONS
// =============================================

async function getPageActivity(pageName) {
  try {
    const { data: statusData, error: statusError } = await supabase
      .from('latest_status')
      .select('*')
      .eq('page_name', pageName);
    
    if (statusError) throw statusError;
    
    if (!statusData || statusData.length === 0) {
      return getEmptyPageData(pageName);
    }

    const depositData = await computePlayerDeposits(pageName);
    const playersWithNotes = await getAllPlayersWithNotes(pageName);
    
    const { data: changesData } = await supabase
      .from('status_changes')
      .select('*')
      .eq('page_name', pageName)
      .order('change_date', { ascending: false })
      .limit(100);

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
    
    statusData.forEach(player => {
      const playerName = player.player_name;
      const originalTimestamp = player.last_deposit_date;
      const lastDepositDisplay = convertUTCToPKT(originalTimestamp);
      
      const nowUTC = new Date();
      const lastDepositUTC = new Date(originalTimestamp);
      const daysSince = Math.floor((nowUTC - lastDepositUTC) / (1000 * 60 * 60 * 24));
      
      const status = player.status || "Inactive";
      
      const playerDeposits = depositData[playerName] || { total: 0, last7Days: 0 };
      
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
    });

    resultPlayers.sort((a, b) => new Date(b.originalTimestamp) - new Date(a.originalTimestamp));

    const counts = {
      Total: resultPlayers.length,
      Active: resultPlayers.filter(p => p.status === "Active").length,
      Inactive: resultPlayers.filter(p => p.status === "Inactive" && p.daysSince >= INACTIVE_THRESHOLD).length,
      RecentActive: 0,
      RecentInactive: 0,
      HighRisk: 0
    };

    return { 
      page: pageName, 
      counts, 
      players: resultPlayers, 
      recentActivePlayers: [], 
      recentInactivePlayers: [],
      highRiskPlayers: []
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
