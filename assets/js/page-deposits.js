// =============================================
// PAGE DEPOSITS PAGE FUNCTIONS
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
const pageDepositsView = document.getElementById('pageDepositsView');

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

  window.addEventListener('click', function(event) {
    if (event.target === refreshModal) {
      hideRefreshModal();
    }
    if (event.target === cleanupModal) {
      hideCleanupModal();
    }
  });
}

async function loadPageData() {
  if (!selectedPage) return;
  
  showLoader();
  disableControlButtons();
  
  try {
    await showPageDeposits();
  } catch (error) {
    handleDataError(error);
  }
}

function handleDataError(error) {
  hideLoader();
  showNotification('Error loading data: ' + error, 'error');
  enableControlButtons();
}

async function showPageDeposits() {
  tableState.deposits.month = 0;
  
  const backDiv = document.getElementById('backContainer');
  backDiv.innerHTML = '<button class="btn btn-secondary" onclick="backToDashboard()"><i class="fas fa-arrow-left"></i> Back to Dashboard</button>';
  
  pageDepositsView.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div class="spinner"></div>
      <p style="margin-top: 1rem; color: var(--text-secondary);">Loading daily deposits data...</p>
    </div>
  `;
  
  await loadPageDepositsData();
}

async function loadPageDepositsData() {
  try {
    const data = await getPageDailyDeposits(selectedPage, tableState.deposits.month);
    renderPageDeposits(data);
    hideLoader();
    enableControlButtons();
  } catch (error) {
    pageDepositsView.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--danger);">
        <p><strong>Error loading daily deposits:</strong></p>
        <p style="margin-top: 1rem; color: var(--text-secondary);">${error}</p>
      </div>
    `;
    hideLoader();
    enableControlButtons();
  }
}

async function changePageDepositsMonth(page) {
  tableState.deposits.month = page - 1;
  pageDepositsView.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div class="spinner"></div>
      <p style="margin-top: 1rem; color: var(--text-secondary);">Loading monthly data...</p>
    </div>
  `;
  await loadPageDepositsData();
}

function renderPageDeposits(data) {
  if (!data.success || !data.dailyDeposits || data.dailyDeposits.length === 0) {
    pageDepositsView.innerHTML = `
      <div class="page-deposits-view">
        <div class="deposits-header">
          <h2 class="deposits-title">Daily Deposits - ${selectedPage}</h2>
          <button class="close-deposits-btn" onclick="closePageDeposits()" title="Close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
          <p>${data.message || "No daily deposit data available."}</p>
        </div>
      </div>
    `;
    return;
  }

  const totalDaysInPeriod = data.dailyDeposits.length;
  const dailyAverage = totalDaysInPeriod > 0 ? data.totalAmount / totalDaysInPeriod : 0;

  let html = `
    <div class="page-deposits-view">
      <div class="deposits-header">
        <h2 class="deposits-title">Daily Deposits - ${selectedPage}</h2>
        <button class="close-deposits-btn" onclick="closePageDeposits()" title="Close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h4 style="color: var(--text-primary); margin-bottom: 1rem; text-align: center;">${data.currentMonth}</h4>
  `;

  if (data.monthlyComparison) {
    const comparison = data.monthlyComparison;
    const comparisonClass = comparison.direction === 'up' ? 'up' : comparison.direction === 'down' ? 'down' : 'same';
    const arrow = comparison.direction === 'up' ? '🔼' : comparison.direction === 'down' ? '🔽' : '⚪';
    
    html += `
      <div class="monthly-comparison ${comparisonClass}">
        ${arrow} $${Math.abs(comparison.difference).toFixed(2)} vs ${comparison.previousMonth} (${comparison.direction === 'up' ? '+' : ''}${comparison.percentage}%)
      </div>
    `;
  }

  html += `
      <div class="monthly-summary">
        <div class="summary-card">
          <div class="summary-value">$${data.totalAmount.toFixed(2)}</div>
          <div class="summary-label">Total Amount</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${data.totalTransactions}</div>
          <div class="summary-label">Total Transactions</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${totalDaysInPeriod}</div>
          <div class="summary-label">Total Days</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">$${dailyAverage.toFixed(2)}</div>
          <div class="summary-label">Daily Average</div>
        </div>
      </div>
    </div>
    
    <div class="table-container">
      <div class="table-header">
        <h3 class="table-title">Daily Deposit Breakdown - ${data.currentMonth}</h3>
        <div class="pagination-controls">
          <div class="pagination-info">
            Page ${data.currentPage} of ${data.totalPages}
          </div>
          <div class="pagination-buttons" id="pageDepositsPaginationContainer"></div>
        </div>
      </div>
      <div class="table-scroll-container">
        <table class="daily-deposits-table">
          <thead>
            <tr>
              <th style="text-align: left; min-width: 120px;">Date</th>
              <th style="text-align: right; min-width: 100px;">Amount</th>
              <th style="text-align: center; min-width: 100px;">Transactions</th>
              <th style="text-align: center; min-width: 140px;">Daily Trend</th>
            </tr>
          </thead>
          <tbody>
  `;

  // DEBUG: Check what dates we actually have
  console.log("Available dates:", data.dailyDeposits.map(d => d.displayDate));
  console.log("Total days:", data.dailyDeposits.length);

  data.dailyDeposits.forEach(day => {
    let trendHtml = '-';
    if (day.trend) {
      const trendClass = day.trend.direction === 'up' ? 'trend-up' : day.trend.direction === 'down' ? 'trend-down' : 'trend-same';
      const arrow = day.trend.direction === 'up' ? '🔼' : day.trend.direction === 'down' ? '🔽' : '⚪';
      const sign = day.trend.direction === 'up' ? '+' : '';
      
      trendHtml = `
        <span class="${trendClass}">
          ${arrow} $${Math.abs(day.trend.difference).toFixed(2)} (${sign}${day.trend.percentage}%)
        </span>
      `;
    }

    const amountClass = day.totalAmount > 0 ? 'amount-cell positive' : 'amount-cell zero';
    const amountDisplay = day.totalAmount > 0 ? '$' + day.totalAmount.toFixed(2) : '$0.00';
    
    html += `
      <tr>
        <td style="text-align: left;">${day.displayDate}</td>
        <td class="${amountClass}">${amountDisplay}</td>
        <td class="count-cell">${day.transactionCount}</td>
        <td class="trend-cell">${trendHtml}</td>
      </tr>
    `;
  });

  html += `
            <tr class="total-row">
              <td style="text-align: left;"><strong>TOTAL</strong></td>
              <td class="amount-cell positive"><strong>$${data.totalAmount.toFixed(2)}</strong></td>
              <td class="count-cell"><strong>${data.totalTransactions}</strong></td>
              <td class="trend-cell">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div style="margin-top: 1.5rem; background: var(--bg-secondary); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
      <p style="color: var(--text-primary); font-size: 0.9rem; text-align: center;">
        <i class="fas fa-info-circle"></i> Showing ${data.dailyDeposits.length} day(s) for ${data.currentMonth}
        ${data.monthlyComparison ? ` | Compared to ${data.monthlyComparison.previousMonth}` : ''}
      </p>
    </div>
  `;

  pageDepositsView.innerHTML = html;

  const paginationContainer = document.getElementById('pageDepositsPaginationContainer');
  if (data.totalPages > 1) {
    renderPagination(data.totalPages, data.currentPage, 1, paginationContainer, 'changePageDepositsMonth');
  }
}

function closePageDeposits() {
  backToDashboard();
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

// FIXED: Proper timezone handling for date generation
async function getPageDailyDeposits(pageName, monthOffset = 0) {
  try {
    const { data, error } = await supabase
      .from('deposits')
      .select('deposit_date, amount, player_name')
      .eq('page_name', pageName)
      .order('deposit_date', { ascending: true });
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return {
        success: false,
        message: "No data found",
        dailyDeposits: [],
        totalAmount: 0,
        totalTransactions: 0,
        monthlyComparison: null,
        availableMonths: []
      };
    }
    
    // Process all deposits and convert to PKT for grouping
    const allDeposits = data.map(deposit => {
      const utcDate = new Date(deposit.deposit_date);
      // Convert to PKT for display and grouping
      const pktDate = new Date(utcDate.getTime() + (5 * 60 * 60 * 1000));
      const dateKey = formatDateForGrouping(pktDate);
      const displayDate = convertUTCToPKTDateOnly(deposit.deposit_date);
      const monthKey = pktDate.toISOString().substring(0, 7); // YYYY-MM format in PKT
      
      return {
        utcDate: utcDate,
        pktDate: pktDate,
        dateKey: dateKey,
        displayDate: displayDate,
        monthKey: monthKey,
        amount: parseFloat(deposit.amount) || 0,
        player_name: deposit.player_name
      };
    }).filter(deposit => deposit.amount > 0);

    if (allDeposits.length === 0) {
      return {
        success: false,
        message: "No deposit data with positive amounts",
        dailyDeposits: [],
        totalAmount: 0,
        totalTransactions: 0,
        monthlyComparison: null,
        availableMonths: []
      };
    }

    // Group by PKT date
    const depositsByDay = {};
    allDeposits.forEach(deposit => {
      if (!depositsByDay[deposit.dateKey]) {
        depositsByDay[deposit.dateKey] = {
          date: deposit.dateKey,
          displayDate: deposit.displayDate,
          monthKey: deposit.monthKey,
          totalAmount: 0,
          transactionCount: 0,
          timestamp: deposit.pktDate.getTime()
        };
      }
      depositsByDay[deposit.dateKey].totalAmount += deposit.amount;
      depositsByDay[deposit.dateKey].transactionCount++;
    });

    // Get all unique months from actual deposit data in PKT
    const allMonths = new Set();
    Object.values(depositsByDay).forEach(day => {
      allMonths.add(day.monthKey);
    });
    
    const sortedMonths = Array.from(allMonths).sort().reverse();
    const availableMonths = sortedMonths.map((month, index) => ({
      month: month,
      display: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      page: index + 1
    }));
    
    if (sortedMonths.length === 0) {
      return {
        success: false,
        message: "No deposit data available",
        dailyDeposits: [],
        totalAmount: 0,
        totalTransactions: 0,
        monthlyComparison: null,
        availableMonths: []
      };
    }
    
    const currentMonthIndex = Math.min(monthOffset, sortedMonths.length - 1);
    const currentMonth = sortedMonths[currentMonthIndex];
    const previousMonth = currentMonthIndex + 1 < sortedMonths.length ? sortedMonths[currentMonthIndex + 1] : null;
    
    // Get actual deposit days for the current month
    const currentMonthDeposits = Object.values(depositsByDay).filter(day => day.monthKey === currentMonth);
    
    // FIXED: Explicit month days definition
    const getDaysInMonth = (year, month) => {
      const monthDays = {
        1: 31,  // January
        2: 28,  // February (not accounting for leap years for simplicity)
        3: 31,  // March
        4: 30,  // April
        5: 31,  // May
        6: 30,  // June
        7: 31,  // July
        8: 31,  // August
        9: 30,  // September
        10: 31, // October
        11: 30, // November
        12: 31  // December
      };
      
      // Handle February in leap years
      if (month === 2) {
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        return isLeapYear ? 29 : 28;
      }
      
      return monthDays[month] || 30; // Default to 30 if month is invalid
    };
    
    // Parse current month
    const [year, month] = currentMonth.split('-').map(Number);
    const daysInMonth = getDaysInMonth(year, month);
    
    console.log(`Month: ${currentMonth}, Year: ${year}, Month: ${month}, Days in month: ${daysInMonth}`);
    
    // FIXED: Create dates in PKT timezone from the beginning
    const currentMonthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const currentMonthEnd = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59));
    
    // Use current PKT time
    const nowPKT = getCurrentPKT();
    const today = getStartOfDayPKT(nowPKT);
    
    // Only generate dates up to today for current month, or full month for past months
    const isCurrentMonth = currentMonth === formatDateForGrouping(nowPKT).substring(0, 7);
    
    // FIXED: Use the actual end date properly in PKT
    let actualEndDate;
    if (isCurrentMonth) {
      actualEndDate = today;
    } else {
      // For past months, use the last day of that month in PKT
      actualEndDate = new Date(Date.UTC(year, month - 1, daysInMonth, 0, 0, 0));
    }
    
    // Create a map of all days in the month with deposits
    const dailyDataMap = {};
    currentMonthDeposits.forEach(day => {
      dailyDataMap[day.date] = day;
    });
    
    // FIXED: Generate ALL days in PKT timezone
    const dailyDepositsArray = [];
    
    // Start from the first day of the month in PKT
    let currentDate = new Date(currentMonthStart);
    
    // DEBUG: Log the date range we're generating
    console.log(`Generating days for ${currentMonth}:`);
    console.log(`Start (UTC): ${currentDate.toISOString()}`);
    console.log(`End (UTC): ${actualEndDate.toISOString()}`);
    console.log(`Days in month: ${daysInMonth}`);
    console.log(`Is current month: ${isCurrentMonth}`);
    
    // FIXED: Generate dates using PKT-aware functions
    for (let day = 1; day <= daysInMonth; day++) {
      // Create date in UTC for the specific day in the month
      const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)); // Use noon to avoid DST issues
      
      // Convert to PKT date string for display
      const pktDate = new Date(utcDate.getTime() + (5 * 60 * 60 * 1000));
      const dateKey = formatDateForGrouping(pktDate);
      const displayDate = convertUTCToPKTDateOnly(utcDate.toISOString());
      
      // Check if we should include this day (for current month, only include up to today)
      const shouldInclude = isCurrentMonth ? 
        pktDate <= nowPKT : 
        true; // For past months, include all days
      
      if (shouldInclude) {
        if (dailyDataMap[dateKey]) {
          // Day with deposits
          dailyDepositsArray.push(dailyDataMap[dateKey]);
        } else {
          // Day without deposits
          dailyDepositsArray.push({
            date: dateKey,
            displayDate: displayDate,
            monthKey: currentMonth,
            totalAmount: 0,
            transactionCount: 0,
            timestamp: pktDate.getTime()
          });
        }
      }
    }
    
    console.log(`Generated ${dailyDepositsArray.length} days for ${currentMonth}`);
    console.log(`Available dates:`, dailyDepositsArray.map(d => d.displayDate));
    
    // Sort by date descending (newest first)
    dailyDepositsArray.sort((a, b) => b.timestamp - a.timestamp);
    
    // Calculate trends
    const dailyDepositsWithTrends = dailyDepositsArray.map((day, index) => {
      let trend = null;
      
      if (index < dailyDepositsArray.length - 1) {
        const previousDay = dailyDepositsArray[index + 1];
        
        if (previousDay.totalAmount > 0 || day.totalAmount > 0) {
          const difference = day.totalAmount - previousDay.totalAmount;
          let percentage = 0;
          
          if (previousDay.totalAmount === 0 && day.totalAmount > 0) {
            percentage = 100;
          } else if (previousDay.totalAmount > 0) {
            percentage = (difference / previousDay.totalAmount) * 100;
          }
          
          trend = {
            difference: difference,
            percentage: percentage.toFixed(1),
            direction: difference > 0 ? 'up' : difference < 0 ? 'down' : 'same'
          };
        }
      }
      
      return {
        ...day,
        trend: trend
      };
    });
    
    const currentMonthTotal = dailyDepositsWithTrends.reduce((sum, day) => sum + day.totalAmount, 0);
    const currentMonthTransactions = dailyDepositsWithTrends.reduce((sum, day) => sum + day.transactionCount, 0);
    const totalDaysInPeriod = dailyDepositsWithTrends.length;
    const dailyAverage = totalDaysInPeriod > 0 ? currentMonthTotal / totalDaysInPeriod : 0;
    
    let previousMonthTotal = 0;
    let previousMonthTransactions = 0;
    let monthlyComparison = null;
    
    if (previousMonth) {
      // Calculate previous month total from actual deposits in that month
      Object.values(depositsByDay).forEach(day => {
        if (day.monthKey === previousMonth) {
          previousMonthTotal += day.totalAmount;
          previousMonthTransactions += day.transactionCount;
        }
      });
      
      const monthlyDifference = currentMonthTotal - previousMonthTotal;
      let monthlyPercentage = 0;
      
      if (previousMonthTotal > 0) {
        monthlyPercentage = (monthlyDifference / previousMonthTotal) * 100;
      } else if (currentMonthTotal > 0) {
        monthlyPercentage = 100;
      }
      
      monthlyComparison = {
        previousMonth: new Date(previousMonth + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        previousMonthTotal: previousMonthTotal,
        previousMonthTransactions: previousMonthTransactions,
        difference: monthlyDifference,
        percentage: monthlyPercentage.toFixed(1),
        direction: monthlyDifference > 0 ? 'up' : monthlyDifference < 0 ? 'down' : 'same'
      };
    }
    
    return {
      success: true,
      dailyDeposits: dailyDepositsWithTrends,
      totalAmount: currentMonthTotal,
      totalTransactions: currentMonthTransactions,
      dailyAverage: dailyAverage,
      totalDaysInPeriod: totalDaysInPeriod,
      monthlyComparison: monthlyComparison,
      currentMonth: new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      availableMonths: availableMonths,
      currentPage: currentMonthIndex + 1,
      totalPages: sortedMonths.length,
      message: `Showing ${totalDaysInPeriod} days for ${new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    };
  } catch (error) {
    console.error('Error getting page daily deposits:', error);
    return {
      success: false,
      message: "Error loading daily deposits",
      dailyDeposits: [],
      totalAmount: 0,
      totalTransactions: 0,
      monthlyComparison: null,
      availableMonths: []
    };
  }
}
