// === UIT SCHEDULE PLANNER PRO — CORE APP LOGIC ===

// === 3D PURPLE POINTER CUSTOM CURSOR (0ms INSTANT GPU TRACKING) ===
(function init3DPurpleCursor() {
  const cursor = document.getElementById('tex3DPurpleCursor');
  if (!cursor) return;

  let isHover = false;
  let isClick = false;
  let lastX = window.innerWidth / 2;
  let lastY = window.innerHeight / 2;

  function updateTransform(x, y) {
    lastX = x;
    lastY = y;
    const scale = isClick ? 'scale(0.88)' : (isHover ? 'scale(1.22) rotate(-6deg)' : 'scale(1)');
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0) ${scale}`;
  }

  window.addEventListener('mousemove', (e) => {
    updateTransform(e.clientX, e.clientY);
  }, { passive: true });

  // Hover and Click events
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, select, option, input, textarea, tr, td, th, label, .class-block, .plan-tab, .resizer-vertical, .resizer-horizontal')) {
      isHover = true;
      document.body.classList.add('cursor-hover');
      updateTransform(lastX, lastY);
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, select, option, input, textarea, tr, td, th, label, .class-block, .plan-tab, .resizer-vertical, .resizer-horizontal')) {
      isHover = false;
      document.body.classList.remove('cursor-hover');
      updateTransform(lastX, lastY);
    }
  });

  window.addEventListener('mousedown', (e) => {
    isClick = true;
    updateTransform(e.clientX, e.clientY);
  });

  window.addEventListener('mouseup', (e) => {
    isClick = false;
    updateTransform(e.clientX, e.clientY);
  });

  window.addEventListener('click', () => {
    document.body.style.cursor = 'none';
  });
})();

// 1. GLOBAL STATE MANAGEMENT
let allData = [];
let myClasses = [];
let colorMap = {};
let isDark = false;
let plans = [];
let activePlanId = null;
let undoStack = [];
let redoStack = [];
let newlyAddedClasses = new Set();

// 2. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  startApp();
});

async function startApp() {
  initEvents();
  loadThemePreference();
  loadWorkspace();
  
  const loadedData = await loadSchoolData();
  if (loadedData && loadedData.length > 0) {
    allData = sortClassesHierarchically(typeof fillMissingCredits === 'function' ? fillMissingCredits(loadedData) : loadedData);
    populateLecturers(allData);
  } else {
    try {
      const resp = await fetch('default_data.json');
      if (resp.ok) {
        const rawJson = await resp.json();
        allData = sortClassesHierarchically(typeof fillMissingCredits === 'function' ? fillMissingCredits(rawJson) : rawJson);
        saveSchoolDataToDB(allData);
        populateLecturers(allData);
      }
    } catch (e) {
      console.warn("Could not load default_data.json automatically", e);
    }
  }
  
  renderPlanTabs();
  refreshAllUI();
  initResizers();
}

// 3. THEME PREFERENCE
function loadThemePreference() {
  const savedTheme = localStorage.getItem('uit_theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark = true;
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark');
  } else {
    isDark = false;
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('dark');
  }
}

function toggleTheme() {
  isDark = !isDark;
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark');
    localStorage.setItem('uit_theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('dark');
    localStorage.setItem('uit_theme', 'light');
  }
  refreshAllUI();
}

// 4. STORAGE & INDEXEDDB
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UIT_Planner_DB_Pro', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('school_data')) {
        db.createObjectStore('school_data');
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveSchoolDataToDB(data) {
  try {
    const db = await initDB();
    const tx = db.transaction('school_data', 'readwrite');
    tx.objectStore('school_data').put(data, 'current_school_data');
  } catch (e) {
    console.error("DB save error", e);
  }
}

async function loadSchoolData() {
  try {
    const db = await initDB();
    const tx = db.transaction('school_data', 'readonly');
    return new Promise((resolve) => {
      const req = tx.objectStore('school_data').get('current_school_data');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

function saveWorkspace() {
  try {
    const activePlan = plans.find(p => p.id === activePlanId);
    if (activePlan) {
      activePlan.classes = [...myClasses];
      activePlan.colorMap = { ...colorMap };
    }
    const workspace = { plans, activePlanId };
    localStorage.setItem('uit_workspace_pro', JSON.stringify(workspace));
  } catch (e) {
    console.error("Workspace save error", e);
  }
}

function loadWorkspace() {
  try {
    const raw = localStorage.getItem('uit_workspace_pro');
    if (raw) {
      const data = JSON.parse(raw);
      if (data.plans && data.plans.length > 0) {
        plans = data.plans;
        activePlanId = data.activePlanId || plans[0].id;
        const activePlan = plans.find(p => p.id === activePlanId) || plans[0];
        activePlanId = activePlan.id;
        myClasses = activePlan.classes || [];
        colorMap = activePlan.colorMap || {};
        return;
      }
    }
  } catch (e) {
    console.error("Workspace load error", e);
  }
  
  plans = [{
    id: Date.now(),
    name: 'Phương án 1',
    classes: [],
    colorMap: {}
  }];
  activePlanId = plans[0].id;
  myClasses = [];
  colorMap = {};
}

// 5. EXCEL FILE HANDLING
function processSchoolExcel(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const buffer = new Uint8Array(e.target.result);
      const workbook = XLSX.read(buffer, { type: 'array' });
      const parsed = parseExcelData(workbook);
      
      if (!parsed || parsed.length === 0) {
        alert("Không tìm thấy dữ liệu lớp mở hợp lệ trong file Excel này!");
        return;
      }
      
      allData = parsed;
      saveSchoolDataToDB(allData);
      populateLecturers(allData);
      refreshAllUI();
      alert(`✅ Đã nạp thành công ${allData.length} lớp học từ file Excel!`);
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi đọc file Excel: " + err.message);
    }
    event.target.value = '';
  };
  reader.readAsArrayBuffer(file);
}

function processOldSchedule(event) {
  processSchoolExcel(event);
}

// 6. LECTURER POPULATION
function populateLecturers(data) {
  const cbb = document.getElementById('cbbGiangVien');
  if (!cbb) return;
  
  const curVal = cbb.value;
  const set = new Set();
  data.forEach(item => {
    if (item['GIẢNG VIÊN'] && item['GIẢNG VIÊN'].trim() !== '') {
      set.add(item['GIẢNG VIÊN'].trim());
    }
  });

  const sortedGv = Array.from(set).sort((a, b) => {
    const nameA = getSortableName(a);
    const nameB = getSortableName(b);
    const comp = nameA.ten.localeCompare(nameB.ten, 'vi');
    return comp !== 0 ? comp : nameA.hoDem.localeCompare(nameB.hoDem, 'vi');
  });

  cbb.innerHTML = '<option value="all">Tất cả GV</option>';
  sortedGv.forEach(gv => {
    const opt = document.createElement('option');
    opt.value = gv;
    opt.textContent = gv;
    cbb.appendChild(opt);
  });

  if (Array.from(cbb.options).some(o => o.value === curVal)) {
    cbb.value = curVal;
  }
}

// 7. CLASS ADDITION & STRICT OVERLAP CHECK
function addClass(classData, batch = false) {
  const newCode = classData['MÃ LỚP'];
  if (myClasses.some(c => c['MÃ LỚP'] === newCode)) return false;

  const newThu = parseInt(classData['THỨ']);
  const newTiets = parseTiet(classData['TIẾT']);

  for (const existing of myClasses) {
    const exThu = parseInt(existing['THỨ']);
    const exTiets = parseTiet(existing['TIẾT']);
    
    if (newThu > 0 && newThu === exThu && newTiets.length > 0 && exTiets.length > 0) {
      const overlappingTiet = newTiets.find(t => exTiets.includes(t));
      if (overlappingTiet) {
        if (!batch) {
          alert(`❌ Không thể thêm lớp ${newCode}!\nTrùng lịch (Thứ ${newThu}, Tiết ${overlappingTiet}) với lớp ${existing['MÃ LỚP']} (${existing['TÊN MÔN']}).`);
        }
        return false;
      }
    }
  }

  if (!batch) saveStateForUndo();
  
  myClasses.push(classData);
  newlyAddedClasses.add(newCode);
  
  const baseCode = classData.BASE_MA || newCode.split('.')[0];
  if (colorMap[baseCode] === undefined) {
    colorMap[baseCode] = Object.keys(colorMap).length % 8;
  }
  
  if (!batch) {
    refreshAllUI();
    setTimeout(() => { newlyAddedClasses.clear(); }, 400);
  }
  return true;
}

function removeClass(maLop) {
  const tooltip = document.getElementById('custom-tooltip');
  if (tooltip) tooltip.style.opacity = '0';
  saveStateForUndo();
  myClasses = myClasses.filter(c => c['MÃ LỚP'] !== maLop && !c['MÃ LỚP'].startsWith(maLop + '.'));
  refreshAllUI();
}

// 8. UNDO / REDO
function saveStateForUndo() {
  undoStack.push({
    classes: JSON.stringify(myClasses),
    colorMap: JSON.stringify(colorMap)
  });
  if (undoStack.length > 30) undoStack.shift();
  redoStack = [];
}

function undoAction() {
  if (undoStack.length === 0) return;
  redoStack.push({
    classes: JSON.stringify(myClasses),
    colorMap: JSON.stringify(colorMap)
  });
  const prev = undoStack.pop();
  myClasses = JSON.parse(prev.classes);
  colorMap = JSON.parse(prev.colorMap);
  refreshAllUI();
}

function redoAction() {
  if (redoStack.length === 0) return;
  undoStack.push({
    classes: JSON.stringify(myClasses),
    colorMap: JSON.stringify(colorMap)
  });
  const next = redoStack.pop();
  myClasses = JSON.parse(next.classes);
  colorMap = JSON.parse(next.colorMap);
  refreshAllUI();
}

// 9. FILTERS & CLEAN FULL CLASS CODE RENDERING
function applyFilters() {
  const tbAvailable = document.getElementById('tbAvailable');
  if (!tbAvailable) return;
  
  tbAvailable.innerHTML = '';
  
  if (allData.length === 0) {
    tbAvailable.innerHTML = `<tr><td colspan="6" class="empty-state">Vui lòng tải File TKB trường để bắt đầu!</td></tr>`;
    return;
  }

  const cbbKhoa = document.getElementById('cbbKhoa').value;
  const cbbGiangVien = document.getElementById('cbbGiangVien').value;
  const cbbBuoi = document.getElementById('cbbBuoi').value;
  const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();

  const registeredCodes = new Set();
  const baseMap = {};
  const occupiedSlots = [];

  myClasses.forEach(c => {
    registeredCodes.add(c['MÃ LỚP']);
    const baseCode = c.BASE_MA || c['MÃ LỚP'].split('.')[0];
    const groupCode = c['MÃ LỚP'].replace(/\.\d+$/, '');
    baseMap[baseCode] = groupCode;
    
    const tiets = parseTiet(c['TIẾT']);
    const thu = (typeof getThuNumber === 'function') ? getThuNumber(c['THỨ']) : parseInt(c['THỨ']);
    if (thu > 0) {
      occupiedSlots.push({ thu, tiets });
    }
  });

  const fragment = document.createDocumentFragment();

  allData.forEach(item => {
    const code = item['MÃ LỚP'].toUpperCase();
    const baseCode = item.BASE_MA || code.split('.')[0];
    const groupCode = code.replace(/\.\d+$/, '');
    const tiets = parseTiet(item['TIẾT']);
    const thu = (typeof getThuNumber === 'function') ? getThuNumber(item['THỨ']) : parseInt(item['THỨ']);

    // 1. Khoa filter
    if (cbbKhoa !== 'all') {
      const allowedPrefixes = cbbKhoa.split(',');
      const matchesPrefix = allowedPrefixes.some(p => new RegExp('^' + p.trim() + '\\d', 'i').test(code));
      if (!matchesPrefix) return;
    }

    // 2. Lecturer filter
    if (cbbGiangVien !== 'all' && item['GIẢNG VIÊN'].trim() !== cbbGiangVien) return;

    // 3. Search text filter
    if (searchInput) {
      const nameMatch = item['TÊN MÔN'].toLowerCase().includes(searchInput);
      const codeMatch = code.toLowerCase().includes(searchInput);
      const gvMatch = item['GIẢNG VIÊN'].toLowerCase().includes(searchInput);
      if (!nameMatch && !codeMatch && !gvMatch) return;
    }

    // 4. Session filter (AM/PM)
    if (cbbBuoi === 'am' && tiets.length > 0 && tiets.some(p => p > 5)) return;
    if (cbbBuoi === 'pm' && tiets.length > 0 && tiets.some(p => p <= 5)) return;

    // 5. Hide registered
    if (registeredCodes.has(code)) return;
    if (baseMap[baseCode] && groupCode !== baseMap[baseCode]) return;
    
    // Time slot conflict check
    const hasTimeConflict = !isNaN(thu) && thu > 0 && occupiedSlots.some(slot => slot.thu === thu && slot.tiets.some(t => tiets.includes(t)));
    if (hasTimeConflict) return;

    const noteText = getThNote(item);
    const thuText = (thu >= 2 && thu <= 7) ? `Thứ ${thu}` : '—';

    // Render Row: Clean, bold, full class code without arrow symbol
    const displayCode = `<span style="font-weight:700;color:var(--accent);">${code}</span>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-ma">${displayCode}</td>
      <td>${item['TÊN MÔN']} ${noteText ? `<span style="font-size:0.75em;color:#ef4444;margin-left:4px;">[${noteText}]</span>` : ''}</td>
      <td>${item['GIẢNG VIÊN'] || '—'}</td>
      <td style="text-align:center">${thuText}</td>
      <td style="text-align:center">${item['TIẾT']}</td>
      <td style="text-align:center">${item['TC']}</td>
    `;

    tr.onclick = () => {
      if (code === groupCode && allData.some(a => a['MÃ LỚP'].startsWith(code + '.'))) {
        document.getElementById('searchInput').value = code + '.';
      } else {
        document.getElementById('searchInput').value = '';
      }
      addClass(item);
    };

    fragment.appendChild(tr);
  });

  if (fragment.children.length === 0) {
    tbAvailable.innerHTML = `<tr><td colspan="6" class="empty-state">Không có lớp phù hợp (hoặc bị trùng lịch).</td></tr>`;
  } else {
    tbAvailable.appendChild(fragment);
  }
}

// 10. PLAN MANAGEMENT
function renderPlanTabs() {
  const container = document.getElementById('planTabsContainer');
  if (!container) return;

  container.innerHTML = '';
  plans.forEach(plan => {
    const tab = document.createElement('div');
    tab.className = `plan-tab ${plan.id === activePlanId ? 'active' : ''}`;
    
    tab.innerHTML = `
      <span onclick="switchPlan(${plan.id})">${plan.name}</span>
      <div class="plan-controls">
        <button class="btn-plan-ctrl" onclick="renamePlan(${plan.id}, event)" title="Đổi tên">✏️</button>
        ${plans.length > 1 ? `<button class="btn-plan-ctrl" onclick="deletePlan(${plan.id}, event)" title="Xóa">❌</button>` : ''}
      </div>
    `;
    container.appendChild(tab);
  });
}

function switchPlan(id) {
  if (id === activePlanId) return;
  saveWorkspace();
  activePlanId = id;
  const target = plans.find(p => p.id === id);
  if (target) {
    myClasses = target.classes || [];
    colorMap = target.colorMap || {};
    renderPlanTabs();
    refreshAllUI();
  }
}

function createNewPlan(duplicate = false) {
  saveWorkspace();
  const newId = Date.now();
  const name = (duplicate ? 'Bản sao ' : 'Phương án ') + (plans.length + 1);
  const newPlan = {
    id: newId,
    name: name,
    classes: duplicate ? [...myClasses] : [],
    colorMap: duplicate ? { ...colorMap } : {}
  };
  plans.push(newPlan);
  switchPlan(newId);
}

function deletePlan(id, event) {
  if (event) event.stopPropagation();
  if (plans.length <= 1) return;
  if (confirm("Bạn có chắc chắn muốn xóa phương án này?")) {
    plans = plans.filter(p => p.id !== id);
    if (id === activePlanId) {
      activePlanId = plans[0].id;
      myClasses = plans[0].classes;
      colorMap = plans[0].colorMap;
    }
    renderPlanTabs();
    refreshAllUI();
  }
}

function renamePlan(id, event) {
  if (event) event.stopPropagation();
  const plan = plans.find(p => p.id === id);
  if (!plan) return;
  const newName = prompt("Nhập tên mới cho phương án:", plan.name);
  if (newName && newName.trim() !== '') {
    plan.name = newName.trim();
    saveWorkspace();
    renderPlanTabs();
  }
}

// 11. UI REFRESH & ACCURATE CREDIT CALCULATION
function refreshAllUI() {
  if (typeof fillMissingCredits === 'function') {
    if (allData && allData.length) fillMissingCredits(allData);
    if (myClasses && myClasses.length) fillMissingCredits(myClasses);
  }
  applyFilters();
  renderRegisteredTable();
  updateStatsBanner();
  
  if (typeof drawTimetable === 'function') {
    drawTimetable(myClasses, colorMap, isDark, newlyAddedClasses);
  }
  
  if (typeof updateDkhpPanel === 'function') {
    updateDkhpPanel(myClasses);
  }
  
  updateExportCodes();
  saveWorkspace();
}

function renderRegisteredTable() {
  const tbRegistered = document.getElementById('tbRegistered');
  if (!tbRegistered) return;
  
  tbRegistered.innerHTML = '';
  myClasses.sort((a, b) => a['MÃ LỚP'].localeCompare(b['MÃ LỚP'])).forEach(item => {
    const displayCode = `<span style="font-weight:700;color:var(--accent);">${item['MÃ LỚP']}</span>`;
    const thu = parseInt(item['THỨ']);
    const thuText = (thu >= 2 && thu <= 7) ? `Thứ ${thu}` : '—';
    const formattedTietText = (typeof formatTietDisplay === 'function') ? formatTietDisplay(item['TIẾT']).replace('Tiết ', '') : item['TIẾT'];

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-ma">${displayCode}</td>
      <td>${item['TÊN MÔN']}</td>
      <td style="text-align:center">${thuText}</td>
      <td style="text-align:center">${formattedTietText}</td>
      <td style="text-align:center">${item['TC']}</td>
    `;
    tr.onclick = () => removeClass(item['MÃ LỚP']);
    tbRegistered.appendChild(tr);
  });
}

function updateStatsBanner() {
  const statsBanner = document.getElementById('statsBanner');
  if (!statsBanner) return;

  const uniqueSubjects = new Set(myClasses.map(c => c.BASE_MA || c['MÃ LỚP'].split('.')[0])).size;
  const totalTC = myClasses.reduce((sum, c) => sum + (parseFloat(c.TC) || 0), 0);

  const text = `Tổng môn: ${uniqueSubjects} | Tổng tín chỉ: ${totalTC} (Khuyến nghị: 14-24)`;
  statsBanner.textContent = text;

  if (totalTC < 14 || totalTC > 24) {
    statsBanner.classList.add('stats-alert');
  } else {
    statsBanner.classList.remove('stats-alert');
  }

  const printStats = document.getElementById('printStats');
  if (printStats) printStats.textContent = text;
}

function updateExportCodes() {
  const txt = document.getElementById('txtExportCodes');
  const delimSelect = document.getElementById('exportDelimiter');
  if (!txt || !delimSelect) return;

  const delim = delimSelect.value === 'newline' ? '\n' : delimSelect.value;
  if (myClasses.length === 0) {
    txt.value = '';
  } else {
    txt.value = myClasses.map(c => c['MÃ LỚP']).sort().join(delim);
  }
}

// 12. EXPORT EXCEL & SCREENSHOT
function exportExcel() {
  if (myClasses.length === 0) {
    alert("TEX-TOOL: Chưa có môn nào trong lịch để xuất Excel!");
    return;
  }

  const gridData = Array.from({ length: 11 }, () => Array(7).fill(''));
  gridData[0] = ['Tiết', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  for (let i = 1; i <= 10; i++) gridData[i][0] = `Tiết ${i}`;

  myClasses.forEach(c => {
    const thu = parseInt(c['THỨ']);
    const tiets = parseTiet(c['TIẾT']);
    if (!isNaN(thu) && thu >= 2 && thu <= 7) {
      tiets.forEach(t => {
        if (t >= 1 && t <= 10) {
          const content = `${c['MÃ LỚP']}\n${c['TÊN MÔN']}\nP:${c['PHÒNG'] || ''}`;
          gridData[t][thu - 1] = gridData[t][thu - 1] ? gridData[t][thu - 1] + '\n' + content : content;
        }
      });
    }
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(gridData);
  XLSX.utils.book_append_sheet(wb, ws, 'TEX-TOOL_TKB');
  XLSX.writeFile(wb, 'TEX-TOOL_TKB_Planner.xlsx');
}

async function copyImageToClipboard() {
  const grid = document.getElementById('timetableGrid');
  if (!grid || myClasses.length === 0) {
    alert("TEX-TOOL: Chưa có môn nào trong lịch để copy ảnh!");
    return;
  }

  try {
    const canvas = await html2canvas(grid, {
      scale: 2,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      logging: false
    });

    canvas.toBlob(async (blob) => {
      try {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        alert("✅ TEX-TOOL: Đã copy ảnh TKB vào Clipboard!");
      } catch (err) {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'TEX-TOOL_Timetable.png';
        a.click();
      }
    }, 'image/png');
  } catch (err) {
    console.error("Screenshot error", err);
    alert("❌ TEX-TOOL: Lỗi khi tạo ảnh TKB!");
  }
}

// 13. FAIL-PROOF RESIZERS & EVENTS
function initResizers() {
  const resizerV = document.getElementById('resizerV');
  const leftPanel = document.getElementById('leftPanel');
  const resizerH = document.getElementById('resizerH');
  const boxAvailable = document.getElementById('boxAvailable');
  const container = document.querySelector('.container');

  if (resizerV && leftPanel && container) {
    let isDraggingV = false;

    const startV = (e) => {
      isDraggingV = true;
      resizerV.classList.add('active');
      document.body.classList.add('is-resizing-v');
      e.preventDefault();
    };

    resizerV.addEventListener('mousedown', startV);
    resizerV.addEventListener('touchstart', startV, { passive: false });

    const moveV = (e) => {
      if (!isDraggingV) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const containerRect = container.getBoundingClientRect();
      let newW = clientX - containerRect.left;
      
      const minW = 250;
      const maxW = containerRect.width - 200; // Allows right panel to shrink to 200px (~20-30%)
      
      if (newW < minW) newW = minW;
      if (newW > maxW) newW = maxW;
      
      leftPanel.style.width = newW + 'px';
      leftPanel.style.flex = `0 0 ${newW}px`;
    };

    window.addEventListener('mousemove', moveV);
    window.addEventListener('touchmove', moveV, { passive: false });

    const endV = () => {
      if (isDraggingV) {
        isDraggingV = false;
        resizerV.classList.remove('active');
        document.body.classList.remove('is-resizing-v');
        if (typeof autoFitText === 'function') autoFitText();
      }
    };

    window.addEventListener('mouseup', endV);
    window.addEventListener('touchend', endV);
  }

  if (resizerH && boxAvailable) {
    let isDraggingH = false;

    const startH = (e) => {
      isDraggingH = true;
      resizerH.classList.add('active');
      document.body.classList.add('is-resizing-h');
      e.preventDefault();
    };

    resizerH.addEventListener('mousedown', startH);
    resizerH.addEventListener('touchstart', startH, { passive: false });

    const moveH = (e) => {
      if (!isDraggingH) return;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const boxRect = boxAvailable.getBoundingClientRect();
      let newH = clientY - boxRect.top;
      
      if (newH < 120) newH = 120;
      if (newH > window.innerHeight * 0.8) newH = window.innerHeight * 0.8;
      
      boxAvailable.style.height = newH + 'px';
    };

    window.addEventListener('mousemove', moveH);
    window.addEventListener('touchmove', moveH, { passive: false });

    const endH = () => {
      if (isDraggingH) {
        isDraggingH = false;
        resizerH.classList.remove('active');
        document.body.classList.remove('is-resizing-h');
      }
    };

    window.addEventListener('mouseup', endH);
    window.addEventListener('touchend', endH);
  }
}

function initEvents() {
  document.getElementById('btnLoadSchool').onclick = () => document.getElementById('fileSchool').click();
  document.getElementById('fileSchool').onchange = processSchoolExcel;
  document.getElementById('btnImportOld').onclick = () => document.getElementById('fileImportOld').click();
  document.getElementById('fileImportOld').onchange = processOldSchedule;

  document.getElementById('btnSaveJSON').onclick = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ plans, activePlanId }));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'TEX-TOOL_Backup.json';
    a.click();
  };

  document.getElementById('btnLoadJSON').onclick = () => document.getElementById('fileJSONLoad').click();
  document.getElementById('fileJSONLoad').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        if (json.plans) {
          plans = json.plans;
          activePlanId = json.activePlanId || plans[0].id;
          const activePlan = plans.find(p => p.id === activePlanId) || plans[0];
          myClasses = activePlan.classes;
          colorMap = activePlan.colorMap;
          renderPlanTabs();
          refreshAllUI();
          alert("✅ Đã tải dữ liệu backup thành công!");
        }
      } catch (err) {
        alert("❌ Lỗi file JSON không hợp lệ!");
      }
    };
    r.readAsText(file);
  };

  document.getElementById('btnExportExcel').onclick = exportExcel;
  document.getElementById('btnPrint').onclick = () => window.print();
  document.getElementById('btnClear').onclick = () => {
    if (confirm("Xóa toàn bộ môn học trong phương án hiện tại?")) {
      saveStateForUndo();
      myClasses = [];
      colorMap = {};
      refreshAllUI();
    }
  };
  document.getElementById('btnUndo').onclick = undoAction;
  document.getElementById('btnRedo').onclick = redoAction;
  document.getElementById('themeToggleBtn').onclick = toggleTheme;
  document.getElementById('btnCopyImageMini').onclick = copyImageToClipboard;

  document.getElementById('cbbKhoa').onchange = applyFilters;
  document.getElementById('cbbGiangVien').onchange = applyFilters;
  document.getElementById('cbbBuoi').onchange = applyFilters;
  document.getElementById('searchInput').oninput = applyFilters;

  document.getElementById('quickAddInput').oninput = (e) => {
    const val = e.target.value;
    if (!val || allData.length === 0) return;
    const codes = val.split(/[\s,\n;\t]+/);
    let addedAny = false;
    codes.forEach(c => {
      const trimmed = c.trim().toUpperCase();
      if (trimmed) {
        const match = allData.find(item => item['MÃ LỚP'].toUpperCase() === trimmed);
        if (match && !myClasses.some(m => m['MÃ LỚP'] === match['MÃ LỚP'])) {
          const added = addClass(match, true);
          if (added) addedAny = true;
        }
      }
    });
    if (addedAny) refreshAllUI();
  };

  document.getElementById('exportDelimiter').onchange = updateExportCodes;
  document.getElementById('btnCopyCodes').onclick = () => {
    const txt = document.getElementById('txtExportCodes');
    if (!txt || !txt.value) return alert("Chưa có mã lớp nào để copy!");
    navigator.clipboard.writeText(txt.value).then(() => {
      const btn = document.getElementById('btnCopyCodes');
      const orig = btn.textContent;
      btn.textContent = "Đã Copy!";
      setTimeout(() => { btn.textContent = orig; }, 1500);
    });
  };

  document.getElementById('btnAddPlan').onclick = () => createNewPlan(false);
  document.getElementById('btnDuplicatePlan').onclick = () => createNewPlan(true);

  const infoModal = document.getElementById('infoModal');
  document.getElementById('btnInfo').onclick = () => { infoModal.style.display = 'flex'; };
  document.getElementById('btnCloseModal').onclick = () => document.getElementById('infoModal').style.display = 'none';
  document.getElementById('btnDkhpHelp').onclick = () => document.getElementById('dkhpHelpModal').style.display = 'flex';
  document.getElementById('btnCloseDkhpHelp').onclick = () => document.getElementById('dkhpHelpModal').style.display = 'none';

  // Tool tabs switching
  const tabDkhpBtn = document.getElementById('tabDkhpBtn');
  const tabExportBtn = document.getElementById('tabExportBtn');
  const tabDkhpContent = document.getElementById('tabDkhpContent');
  const tabExportContent = document.getElementById('tabExportContent');
  const exportDelimiter = document.getElementById('exportDelimiter');

  if (tabDkhpBtn && tabExportBtn) {
    tabDkhpBtn.onclick = () => {
      tabDkhpBtn.classList.add('active');
      tabExportBtn.classList.remove('active');
      tabDkhpContent.style.display = 'flex';
      tabExportContent.style.display = 'none';
      if (exportDelimiter) exportDelimiter.style.display = 'none';
    };

    tabExportBtn.onclick = () => {
      tabExportBtn.classList.add('active');
      tabDkhpBtn.classList.remove('active');
      tabExportContent.style.display = 'flex';
      tabDkhpContent.style.display = 'none';
      if (exportDelimiter) exportDelimiter.style.display = 'inline-block';
    };
  }

  const dkhpHelpModal = document.getElementById('dkhpHelpModal');

  window.onclick = (e) => {
    if (e.target === infoModal) infoModal.style.display = 'none';
    if (e.target === dkhpHelpModal) dkhpHelpModal.style.display = 'none';
  };

  window.onresize = () => {
    if (typeof autoFitText === 'function') autoFitText();
  };
}
