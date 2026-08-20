// === TIMETABLE RENDERER — TEX-TOOL PRO OVERHAUL ===

const LIGHT_PALETTE = [
  { bg: '#DBEAFE', border: '#3B82F6', text: '#1E3A8A' },  // Blue
  { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },  // Green
  { bg: '#FEF3C7', border: '#F59E0B', text: '#78350F' },  // Amber
  { bg: '#EDE9FE', border: '#8B5CF6', text: '#4C1D95' },  // Purple
  { bg: '#FCE7F3', border: '#EC4899', text: '#831843' },  // Pink
  { bg: '#CFFAFE', border: '#06B6D4', text: '#164E63' },  // Cyan
  { bg: '#FEF9C3', border: '#EAB308', text: '#713F12' },  // Yellow
  { bg: '#E0E7FF', border: '#6366F1', text: '#312E81' },  // Indigo
];

const DARK_PALETTE = [
  { bg: '#1E3A5F', border: '#60A5FA', text: '#BFDBFE' },
  { bg: '#064E3B', border: '#34D399', text: '#A7F3D0' },
  { bg: '#78350F', border: '#FBBF24', text: '#FEF3C7' },
  { bg: '#4C1D95', border: '#A78BFA', text: '#EDE9FE' },
  { bg: '#831843', border: '#F472B6', text: '#FCE7F3' },
  { bg: '#164E63', border: '#22D3EE', text: '#CFFAFE' },
  { bg: '#713F12', border: '#FACC15', text: '#FEF9C3' },
  { bg: '#312E81', border: '#818CF8', text: '#E0E7FF' },
];

const TIME_SLOTS = [
  "",
  "(7:30 - 8:15)",
  "(8:15 - 9:00)",
  "(9:00 - 9:45)",
  "(10:00 - 10:45)",
  "(10:45 - 11:30)",
  "(13:00 - 13:45)",
  "(13:45 - 14:30)",
  "(14:30 - 15:15)",
  "(15:30 - 16:15)",
  "(16:15 - 17:00)"
];

function initGridStructure(grid) {
  let html = '<div class="grid-header" style="grid-column: 1; grid-row: 1; font-weight: 800; font-size: 0.82em; line-height: 1.2;">Thứ /<br>Tiết</div>';
  for (let thu = 2; thu <= 7; thu++) {
    html += `<div class="grid-header" style="grid-column: ${thu}; grid-row: 1;">Thứ ${thu}</div>`;
  }

  for (let tiet = 1; tiet <= 10; tiet++) {
    html += `<div class="grid-time" style="grid-column: 1; grid-row: ${tiet + 1};">
      <span>Tiết ${tiet}</span>
      <span class="time-sub">${TIME_SLOTS[tiet]}</span>
    </div>`;
    for (let thu = 2; thu <= 7; thu++) {
      html += `<div class="grid-cell" data-thu="${thu}" data-tiet="${tiet}" style="grid-column: ${thu}; grid-row: ${tiet + 1};"></div>`;
    }
  }

  grid.innerHTML = html;
}

function getThuNumber(val) {
  if (val === null || val === undefined) return 0;
  if (typeof parseThuValue === 'function') {
    const res = parseThuValue(val);
    if (res >= 2 && res <= 7) return res;
  }
  const str = val.toString().trim();
  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 2 && num <= 7) return num;
  
  const match = str.match(/[2-7]/);
  if (match) return parseInt(match[0], 10);
  
  return 0;
}

function drawTimetable(myClasses, colorMap, isDark, newlyAdded) {
  const tooltip = document.getElementById('custom-tooltip');
  if (tooltip) tooltip.style.opacity = '0';

  const grid = document.getElementById('timetableGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  initGridStructure(grid);
  
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const unscheduledClasses = [];

  myClasses.forEach(c => {
    const baseCode = c.BASE_MA || c['MÃ LỚP'].split('.')[0];
    let colorIdx = colorMap[baseCode];
    if (colorIdx === undefined) colorIdx = 0;
    const colorInfo = palette[colorIdx % palette.length];
    
    const isNew = newlyAdded && newlyAdded.has(c['MÃ LỚP']);
    
    const tietArr = (typeof parseTiet === 'function') ? parseTiet(c['TIẾT']) : [];
    const thu = getThuNumber(c['THỨ']);

    if (tietArr.length > 0 && thu >= 2 && thu <= 7) {
      const block = createClassBlock(c, colorInfo, isNew);
      if (block) grid.appendChild(block);
    } else {
      unscheduledClasses.push({ classData: c, colorInfo, isNew });
    }
  });

  renderUnscheduledClasses(unscheduledClasses);
  setTimeout(autoFitText, 40);
}

function renderUnscheduledClasses(items) {
  const box = document.getElementById('freeClassesBox');
  const container = document.getElementById('freeClassesContainer');
  if (!box || !container) return;

  if (!items || items.length === 0) {
    box.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  box.style.display = 'flex';
  container.innerHTML = '';

  items.forEach(({ classData, colorInfo, isNew }) => {
    const card = document.createElement('div');
    card.className = 'free-class-card' + (isNew ? ' animate-popIn' : '');
    card.style.backgroundColor = colorInfo.bg;
    card.style.borderColor = colorInfo.border;
    card.style.color = colorInfo.text;

    const roomVal = (classData['PHÒNG'] && classData['PHÒNG'] !== '—') ? classData['PHÒNG'] : '';
    const gvVal = classData['GIẢNG VIÊN'] || '';
    const bdDate = classData['NGÀY BĐ'] || '';
    const ktDate = classData['NGÀY KT'] || '';
    const dateHtml = (bdDate && ktDate) ? `<div class="free-card-dates">BĐ: ${bdDate}<br>KT: ${ktDate}</div>` : '';

    card.innerHTML = `
      <div class="free-card-header">
        <span class="free-card-code">${classData['MÃ LỚP']}</span>
        <button class="free-card-delete" title="Xóa môn" onclick="event.stopPropagation(); const tt = document.getElementById('custom-tooltip'); if (tt) tt.style.opacity='0'; removeClass('${classData['MÃ LỚP']}');">✕</button>
      </div>
      <div class="free-card-title">${classData['TÊN MÔN']}</div>
      ${gvVal ? `<div class="free-card-gv">${gvVal}</div>` : ''}
      ${roomVal ? `<div class="free-card-room">P: ${roomVal}</div>` : ''}
      ${dateHtml}
    `;

    container.appendChild(card);
  });
}

function autoFitText() {
  const blocks = document.querySelectorAll('.class-block');
  blocks.forEach(block => {
    const content = block.querySelector('.block-content');
    if (!content) return;

    let size = 12;
    block.style.fontSize = size + 'px';
    
    while ((content.scrollHeight > block.clientHeight || content.scrollWidth > block.clientWidth) && size > 9.5) {
      size -= 0.5;
      block.style.fontSize = size + 'px';
    }
  });
}

function createClassBlock(classData, colorInfo, isNew) {
  const tietArr = (typeof parseTiet === 'function') ? parseTiet(classData['TIẾT']) : [];
  const thu = getThuNumber(classData['THỨ']);

  const div = document.createElement('div');
  div.className = 'class-block' + (isNew ? ' animate-popIn' : '');
  div.setAttribute('data-code', classData['MÃ LỚP']);
  
  if (tietArr.length > 0 && thu >= 2 && thu <= 7) {
    div.style.gridColumn = thu;
    div.style.gridRow = `${tietArr[0] + 1} / span ${tietArr.length}`;
  }
  
  div.style.backgroundColor = colorInfo.bg;
  div.style.borderColor = colorInfo.border;
  div.style.color = colorInfo.text;
  
  const roomVal = (classData['PHÒNG'] && classData['PHÒNG'] !== '—') ? classData['PHÒNG'] : '';
  const gvVal = classData['GIẢNG VIÊN'] || '';
  const bdDate = classData['NGÀY BĐ'] || '';
  const ktDate = classData['NGÀY KT'] || '';
  const dateHtml = (bdDate && ktDate) ? `<div class="b-dates">BĐ: ${bdDate}<br>KT: ${ktDate}</div>` : '';
  const formattedTiet = (typeof formatTietDisplay === 'function') ? formatTietDisplay(classData['TIẾT']) : (classData['TIẾT'] || '—');

  div.innerHTML = `
    <div class="block-delete-btn" title="Xóa lớp này khỏi lịch" onclick="event.stopPropagation(); const tt = document.getElementById('custom-tooltip'); if (tt) tt.style.opacity='0'; removeClass('${classData['MÃ LỚP']}');">✕</div>
    <div class="block-content">
      <div class="b-code">${classData['MÃ LỚP']}</div>
      <div class="b-name">${classData['TÊN MÔN']}</div>
      ${gvVal ? `<div class="b-gv">${gvVal}</div>` : ''}
      ${roomVal ? `<div class="b-room">P: ${roomVal}</div>` : ''}
      ${dateHtml}
    </div>
  `;
  
  let tooltipLines = [
    `📌 Mã lớp: ${classData['MÃ LỚP']}`,
    `📖 Tên môn: ${classData['TÊN MÔN']}`,
    `👨‍🏫 Giảng viên: ${classData['GIẢNG VIÊN'] || '—'}`,
    `🚪 Phòng: ${classData['PHÒNG'] || '—'}`,
    `⏰ Thời gian: Thứ ${classData['THỨ']} (${formattedTiet})`,
    `💳 Tín chỉ: ${classData['TC']}`
  ];

  if (bdDate && ktDate) tooltipLines.push(`📅 Lịch học: ${bdDate} ➔ ${ktDate}`);
  if (classData['CÁCH TUẦN']) tooltipLines.push(`🔄 Cách tuần: Cách ${classData['CÁCH TUẦN']} tuần`);
  if (classData['GHI CHÚ']) tooltipLines.push(`📝 Ghi chú: ${classData['GHI CHÚ']}`);

  const tooltipText = tooltipLines.join('\n');

  const tooltip = document.getElementById('custom-tooltip');
  div.onmousemove = (e) => {
    if (!tooltip) return;
    tooltip.textContent = tooltipText;
    tooltip.style.left = (e.clientX + 16) + 'px';
    tooltip.style.top = (e.clientY + 16) + 'px';
    tooltip.style.opacity = '1';
  };
  
  div.onmouseleave = () => {
    if (tooltip) tooltip.style.opacity = '0';
  };
  
  return div;
}
