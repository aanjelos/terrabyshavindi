let reportData = [];
let billingData = {};
let currentData = null;
let previousData = null;
let lastDisplayed = {
  activeUsers: 0, newUsers: 0, avgEngagementTimeSeconds: 0,
  clicks: 0, impressions: 0, ctr: 0, position: 0, mobilePct: 0
};

// Password Gate Logic
const GATE_PASSWORD = 'pineappleonpizza';

document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem('clientAuth') === 'true') {
    document.getElementById('password-gate').classList.add('hidden');
    initReports();
  }
});

function checkPassword() {
  const input = document.getElementById('gate-password').value;
  if (input === GATE_PASSWORD) {
    sessionStorage.setItem('clientAuth', 'true');
    document.getElementById('password-gate').classList.add('hidden');
    initReports();
  } else {
    document.getElementById('gate-error').style.display = 'block';
  }
}

function togglePasswordVisibility() {
  const input = document.getElementById('gate-password');
  const btn = document.querySelector('.btn-toggle-password');
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = '<i data-lucide="eye-off" id="password-eye-icon" style="width:20px;height:20px;"></i>';
  } else {
    input.type = 'password';
    btn.innerHTML = '<i data-lucide="eye" id="password-eye-icon" style="width:20px;height:20px;"></i>';
  }
  lucide.createIcons();
}

function lockReports() {
  sessionStorage.removeItem('clientAuth');
  document.getElementById('gate-password').value = '';
  document.getElementById('gate-password').type = 'password';
  document.querySelector('.btn-toggle-password').innerHTML = '<i data-lucide="eye" id="password-eye-icon" style="width:20px;height:20px;"></i>';
  lucide.createIcons();
  document.getElementById('password-gate').classList.remove('hidden');
  document.getElementById('gate-error').style.display = 'none';
}

// Data Fetching and Initialization
function initReports() {
  try {
    const json = window.reportsDataConfig;
    reportData = json.reports;
    billingData = json.billing;

    renderBilling();
    populateDropdown();
    
    // Default to the last month in the array that has data
    if (reportData.length > 0) {
      let defaultMonth = reportData[reportData.length - 1].monthId;
      for (let i = reportData.length - 1; i >= 0; i--) {
        if (reportData[i].overview !== null) {
          defaultMonth = reportData[i].monthId;
          break;
        }
      }
      document.getElementById('month-select').value = defaultMonth;
      loadReportData();
    }
  } catch (error) {
    console.error("Failed to load report data:", error);
  }
}

function renderBilling() {
  document.getElementById('bill-monthly-status').innerText = billingData.monthlyCharge.status;
  document.getElementById('bill-monthly-amount').innerText = billingData.monthlyCharge.amount;
  document.getElementById('bill-monthly-date').innerText = billingData.monthlyCharge.dueDate;

  document.getElementById('bill-annual-status').innerText = billingData.annualRenewal.status;
  document.getElementById('bill-annual-date').innerText = `Renews on: ${billingData.annualRenewal.date}`;
}

function populateDropdown() {
  const select = document.getElementById('month-select');
  select.innerHTML = '';
  // Populate in reverse order so newest is at the top
  for (let i = reportData.length - 1; i >= 0; i--) {
    const opt = document.createElement('option');
    opt.value = reportData[i].monthId;
    opt.text = reportData[i].label;
    select.appendChild(opt);
  }
}

function loadReportData() {
  const selectedId = document.getElementById('month-select').value;
  const index = reportData.findIndex(r => r.monthId === selectedId);
  if (index === -1) return;

  currentData = reportData[index];
  previousData = index > 0 ? reportData[index - 1] : null;

  document.getElementById('period-label').innerText = currentData.period;

  // If selecting a month with no data, reset lastDisplayed to 0 for next animation
  if (!currentData.overview) {
    lastDisplayed = { activeUsers: 0, newUsers: 0, avgEngagementTimeSeconds: 0, clicks: 0, impressions: 0, ctr: 0, position: 0, mobilePct: 0 };
  }

  renderOverview();
  renderSearchPerformance();
  renderQueries();
  renderSources();
  renderLocations();
  renderDevices();
  
  // Re-init lucide icons in case any were added dynamically
  lucide.createIcons();
}

function animateValue(obj, start, end, duration, formatFn = Math.round) {
  if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
    const current = start + ease * (end - start);
    obj.innerHTML = formatFn(current);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.innerHTML = formatFn(end);
    }
  };
  window.requestAnimationFrame(step);
}

function getTrendHTML(current, previous, inverseGood = false) {
  if (current === null || current === undefined || previous === null || previous === undefined) return '';
  if (current > previous) {
    return `<span class="trend ${inverseGood ? 'down' : 'up'}"><i data-lucide="arrow-up" style="width:16px;height:16px;"></i></span>`;
  } else if (current < previous) {
    return `<span class="trend ${inverseGood ? 'up' : 'down'}"><i data-lucide="arrow-down" style="width:16px;height:16px;"></i></span>`;
  }
  return `<span class="trend none"><i data-lucide="minus" style="width:16px;height:16px;"></i></span>`;
}

function formatTime(seconds) {
  if (seconds == null) return "-";
  const rounded = Math.round(seconds);
  const m = Math.floor(rounded / 60);
  const s = rounded % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// Render Functions
function renderOverview() {
  const d = currentData.overview;
  const p = previousData?.overview;
  const el = document.getElementById('overview-content');
  if (!d) {
    el.innerHTML = '<div class="empty-state">Not available for this period.</div>';
    el.parentElement.classList.add('hide-in-print', 'no-print', 'is-empty');
    return;
  }
  el.parentElement.classList.remove('hide-in-print', 'no-print', 'is-empty');

  el.innerHTML = `
    <div class="stat-box">
      <div class="stat-label">Active Users</div>
      <div class="stat-value"><span id="val-activeUsers">${lastDisplayed.activeUsers}</span> ${getTrendHTML(d.activeUsers, p?.activeUsers)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">New Users</div>
      <div class="stat-value"><span id="val-newUsers">${lastDisplayed.newUsers}</span> ${getTrendHTML(d.newUsers, p?.newUsers)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Avg Engagement</div>
      <div class="stat-value"><span id="val-avgTime">${formatTime(lastDisplayed.avgEngagementTimeSeconds)}</span> ${getTrendHTML(d.avgEngagementTimeSeconds, p?.avgEngagementTimeSeconds)}</div>
    </div>
  `;

  animateValue(document.getElementById('val-activeUsers'), lastDisplayed.activeUsers, d.activeUsers, 1000);
  animateValue(document.getElementById('val-newUsers'), lastDisplayed.newUsers, d.newUsers, 1000);
  animateValue(document.getElementById('val-avgTime'), lastDisplayed.avgEngagementTimeSeconds, d.avgEngagementTimeSeconds, 1000, formatTime);

  lastDisplayed.activeUsers = d.activeUsers;
  lastDisplayed.newUsers = d.newUsers;
  lastDisplayed.avgEngagementTimeSeconds = d.avgEngagementTimeSeconds;
}

function renderSearchPerformance() {
  const d = currentData.searchPerformance;
  const p = previousData?.searchPerformance;
  const el = document.getElementById('search-perf-content');
  if (!d) {
    el.innerHTML = '<div class="empty-state">Not available for this period.</div>';
    el.parentElement.classList.add('hide-in-print', 'no-print', 'is-empty');
    return;
  }
  el.parentElement.classList.remove('hide-in-print', 'no-print', 'is-empty');

  el.innerHTML = `
    <div class="stat-box">
      <div class="stat-label">Total Clicks</div>
      <div class="stat-value"><span id="val-clicks">${lastDisplayed.clicks}</span> ${getTrendHTML(d.clicks, p?.clicks)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Total Impressions</div>
      <div class="stat-value"><span id="val-impressions">${lastDisplayed.impressions}</span> ${getTrendHTML(d.impressions, p?.impressions)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Average CTR</div>
      <div class="stat-value"><span id="val-ctr">${lastDisplayed.ctr}</span>% ${getTrendHTML(d.ctr, p?.ctr)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Avg Position</div>
      <div class="stat-value"><span id="val-position">${lastDisplayed.position}</span> ${getTrendHTML(d.position, p?.position, true)}</div>
    </div>
  `;

  const formatDec = (val) => val.toFixed(1);
  animateValue(document.getElementById('val-clicks'), lastDisplayed.clicks, d.clicks, 1000);
  animateValue(document.getElementById('val-impressions'), lastDisplayed.impressions, d.impressions, 1000);
  animateValue(document.getElementById('val-ctr'), lastDisplayed.ctr, d.ctr, 1000, formatDec);
  animateValue(document.getElementById('val-position'), lastDisplayed.position, d.position, 1000, formatDec);

  lastDisplayed.clicks = d.clicks;
  lastDisplayed.impressions = d.impressions;
  lastDisplayed.ctr = d.ctr;
  lastDisplayed.position = d.position;
}

function renderQueries() {
  const d = currentData.topQueries;
  const el = document.getElementById('queries-content');
  if (!d || d.length === 0) {
    el.innerHTML = '<div class="empty-state">Not available for this period.</div>';
    el.parentElement.classList.add('hide-in-print', 'no-print', 'is-empty');
    return;
  }
  el.parentElement.classList.remove('hide-in-print', 'no-print', 'is-empty');
  let rows = '';
  d.forEach((q, i) => {
    rows += `<tr class="stagger-item" style="animation-delay: ${i * 0.05}s"><td>${q.query}</td><td style="text-align:right;">${q.clicks}</td><td style="text-align:right; color:var(--khaki);">${q.impressions}</td></tr>`;
  });
  el.innerHTML = `<table><tr><th>Query</th><th style="text-align:right;">Clicks</th><th style="text-align:right;">Imp.</th></tr>${rows}</table>`;
}

function renderSources() {
  const d = currentData.trafficSources;
  const el = document.getElementById('sources-content');
  if (!d || d.length === 0) {
    el.innerHTML = '<div class="empty-state">No data available for this period.</div>';
    el.parentElement.classList.add('hide-in-print', 'no-print', 'is-empty');
    return;
  }
  el.parentElement.classList.remove('hide-in-print', 'no-print', 'is-empty');
  const maxVal = Math.max(...d.map(s => s.value));
  let bars = '';
  d.forEach((s, i) => {
    const pct = (s.value / maxVal) * 100;
    bars += `
      <div class="bar-row stagger-item" style="animation-delay: ${i * 0.05}s">
        <div class="bar-label">${s.source}</div>
        <div class="bar-track"><div class="bar-fill" style="width: 0%;" data-width="${pct}%"></div></div>
        <div class="bar-value">${s.value}</div>
      </div>
    `;
  });
  el.innerHTML = bars;
  
  // Animate bars
  setTimeout(() => {
    el.querySelectorAll('.bar-fill').forEach(fill => {
      fill.style.width = fill.getAttribute('data-width');
    });
  }, 100);
}

function renderLocations() {
  const d = currentData.topLocations;
  const el = document.getElementById('locations-content');
  if (!d || d.length === 0) {
    el.innerHTML = '<div class="empty-state">No data available for this period.</div>';
    el.parentElement.classList.add('hide-in-print', 'no-print', 'is-empty');
    return;
  }
  el.parentElement.classList.remove('hide-in-print', 'no-print', 'is-empty');
  let rows = '';
  d.forEach((l, i) => {
    let valStr = l.value !== null ? `<td style="text-align:right; font-weight:600;">${l.value}</td>` : '';
    rows += `<tr class="stagger-item" style="animation-delay: ${i * 0.05}s"><td>${i+1}. ${l.city}</td>${valStr}</tr>`;
  });
  el.innerHTML = `<table>${rows}</table>`;
}

function renderDevices() {
  const d = currentData.trafficByDevice;
  const el = document.getElementById('devices-content');
  if (!d || d.length === 0) {
    el.innerHTML = '<div class="empty-state">No data available for this period.</div>';
    el.parentElement.classList.add('hide-in-print', 'no-print', 'is-empty');
    return;
  }
  el.parentElement.classList.remove('hide-in-print', 'no-print', 'is-empty');
  
  const mobile = d.find(x => x.device === 'Mobile')?.percentage || 0;
  const desktop = d.find(x => x.device === 'Desktop')?.percentage || 0;

  if (!el.querySelector('.pie-chart')) {
    el.innerHTML = `
      <div class="pie-chart" style="--p1: 0%"></div>
      <div class="pie-legend">
        <div class="legend-item"><div class="legend-color" style="background:var(--hunter-green)"></div> Mobile <span id="mobile-pct">0</span>%</div>
        <div class="legend-item"><div class="legend-color" style="background:var(--burnt-sienna)"></div> Desktop <span id="desktop-pct">0</span>%</div>
      </div>
    `;
  }
  
  const pie = el.querySelector('.pie-chart');
  const mPct = el.querySelector('#mobile-pct');
  const dPct = el.querySelector('#desktop-pct');

  const formatDec = (val) => val.toFixed(1);

  // Animate the text values
  animateValue(mPct, lastDisplayed.mobilePct, mobile, 1000, formatDec);
  animateValue(dPct, 100 - lastDisplayed.mobilePct, desktop, 1000, formatDec);

  // Animate the pie chart conic-gradient manually since CSS vars don't always transition cleanly
  let startTimestamp = null;
  const startPie = lastDisplayed.mobilePct;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / 1000, 1);
    const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
    const current = startPie + ease * (mobile - startPie);
    if (pie) pie.style.setProperty('--p1', current + '%');
    
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      if (pie) pie.style.setProperty('--p1', mobile + '%');
    }
  };
  window.requestAnimationFrame(step);

  lastDisplayed.mobilePct = mobile;
}
