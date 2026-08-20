// === SMART EXCEL PARSER — UIT PLANNER PRO ===

const COLUMN_ALIASES = {
  'MÃ LỚP': ['MALOP', 'MaLop', 'Mã lớp', 'Mã LHP', 'MA LOP'],
  'TÊN MÔN': ['TENMH', 'TenMH', 'Tên môn học', 'TÊN MÔN HỌC', 'TEN MON HOC', 'TENMH_DAT', 'TÊN MH'],
  'GIẢNG VIÊN': ['TENGV', 'TenGV', 'Tên giảng viên', 'TÊN GIẢNG VIÊN', 'CBGD', 'TEN GIANG VIEN'],
  'THỨ': ['THU', 'Thu', 'Thứ'],
  'TIẾT': ['TIET', 'Tiet', 'Tiết'],
  'PHÒNG': ['PHONGHOC', 'PhongHoc', 'Phòng học', 'PHÒNG HỌC', 'PHONG HOC'],
  'TC': ['SOTC', 'SoTC', 'SỐ TC', 'Số TC', 'SO TC', 'TC', 'STC', 'SỐ TÍN CHỈ', 'SOTINCHI', 'TINCHI', 'SO_TC', 'SO TCCD', 'TCCD', 'TC_HP', 'CREDIT', 'CREDITS', 'Số TC', 'SỐ TÍN CHỈ HP'],
  'CÁCH TUẦN': ['CACHTUAN', 'CachTuan', 'Cách tuần', 'CÁCH TUẦN'],
  'LOẠI': ['HTGD', 'HtGD', 'Hình thức', 'HTGD_TEN'],
  'MÃ MH': ['MAMH', 'MaMH', 'Mã môn học'],
  'MÃ LỚP LT': ['MA LOP LT', 'MaLopLT', 'MA LOP LT'],
  'GHI CHÚ': ['GHICHU', 'GhiChu', 'Ghi chú', 'GHI CHÚ'],
  'NGÀY BĐ': ['NBD', 'NgayBD', 'Ngày BĐ', 'NGÀY BẮT ĐẦU'],
  'NGÀY KT': ['NKT', 'NgayKT', 'Ngày KT', 'NGÀY KẾT THÚC'],
};

function findColumnIndex(headers, targetAliases) {
  const normalizedHeaders = headers.map(h => (h || '').toString().trim().toUpperCase());
  const normalizedAliases = targetAliases.map(a => a.toString().trim().toUpperCase());
  
  for (let i = 0; i < normalizedHeaders.length; i++) {
    if (normalizedAliases.includes(normalizedHeaders[i])) {
      return i;
    }
  }
  return -1;
}

function findTCColumnIndex(headers) {
  const norm = headers.map(h => (h || '').toString().trim().toUpperCase());
  
  const exacts = ['SOTC', 'SO TC', 'SỐ TC', 'STC', 'SỐ TÍN CHỈ', 'SOTINCHI', 'TINCHI', 'TC', 'CREDIT', 'CREDITS', 'SO_TC', 'TC_HP', 'TCCD', 'SO TCCD'];
  for (let i = 0; i < norm.length; i++) {
    if (exacts.includes(norm[i])) return i;
  }
  
  for (let i = 0; i < norm.length; i++) {
    const h = norm[i];
    if (h.includes('TÍN CHỈ') || h.includes('TIN CHI') || h.includes('SOTC') || h.includes('STC') || h === 'TC') {
      return i;
    }
  }
  
  return -1;
}

function parseThuValue(val) {
  if (val === null || val === undefined) return 0;
  const str = val.toString().trim().toLowerCase();
  if (!str) return 0;
  
  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 2 && num <= 7) return num;
  
  if (str.includes('hai') || str.includes('2') || str.includes('mon')) return 2;
  if (str.includes('ba') || str.includes('3') || str.includes('tue')) return 3;
  if (str.includes('tư') || str.includes('4') || str.includes('wed')) return 4;
  if (str.includes('năm') || str.includes('5') || str.includes('thu')) return 5;
  if (str.includes('sáu') || str.includes('6') || str.includes('fri')) return 6;
  if (str.includes('bảy') || str.includes('7') || str.includes('sat')) return 7;
  
  return 0;
}

function parseExcelData(workbook) {
  const allParsed = [];
  const seenMap = new Set();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rawData || rawData.length === 0) continue;

    let currentColIndices = null;
    let headers = null;

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      const rowStr = row.map(c => (c || '').toString().toUpperCase()).join(' ');
      if (rowStr.includes('MALOP') || rowStr.includes('MÃ LỚP') || rowStr.includes('TENMH') || rowStr.includes('TÊN MÔN')) {
        headers = row;
        currentColIndices = {
          'MÃ LỚP': findColumnIndex(headers, COLUMN_ALIASES['MÃ LỚP']),
          'MÃ LỚP LT': findColumnIndex(headers, COLUMN_ALIASES['MÃ LỚP LT']),
          'TÊN MÔN': findColumnIndex(headers, COLUMN_ALIASES['TÊN MÔN']),
          'GIẢNG VIÊN': findColumnIndex(headers, COLUMN_ALIASES['GIẢNG VIÊN']),
          'THỨ': findColumnIndex(headers, COLUMN_ALIASES['THỨ']),
          'TIẾT': findColumnIndex(headers, COLUMN_ALIASES['TIẾT']),
          'PHÒNG': findColumnIndex(headers, COLUMN_ALIASES['PHÒNG']),
          'TC': findTCColumnIndex(headers),
          'LOẠI': findColumnIndex(headers, COLUMN_ALIASES['LOẠI']),
          'GHI CHÚ': findColumnIndex(headers, COLUMN_ALIASES['GHI CHÚ']),
          'NGÀY BĐ': findColumnIndex(headers, COLUMN_ALIASES['NGÀY BĐ']),
          'NGÀY KT': findColumnIndex(headers, COLUMN_ALIASES['NGÀY KT']),
          'CÁCH TUẦN': findColumnIndex(headers, COLUMN_ALIASES['CÁCH TUẦN']),
        };
        continue;
      }

      if (!currentColIndices) continue;

      const maLop = row[currentColIndices['MÃ LỚP']] || row[currentColIndices['MÃ LỚP LT']];
      if (!maLop) continue;

      const codeStr = maLop.toString().trim();
      if (!codeStr || codeStr.toUpperCase() === 'MALOP' || codeStr.toUpperCase() === 'MÃ LỚP') continue;

      const thuVal = parseThuValue(row[currentColIndices['THỨ']]);
      const thTiet = (row[currentColIndices['TIẾT']] || '').toString().trim();
      const baseMa = codeStr.split('.')[0];
      const htgd = (row[currentColIndices['LOẠI']] || '').toString().trim();

      let tcVal = 0;
      if (currentColIndices['TC'] !== -1 && row[currentColIndices['TC']] !== undefined) {
        tcVal = parseFloat(row[currentColIndices['TC']]);
        if (isNaN(tcVal)) tcVal = 0;
      }

      if (tcVal === 0 && headers) {
        for (let c = 0; c < row.length; c++) {
          const val = parseFloat(row[c]);
          if (!isNaN(val) && val >= 1 && val <= 6 && c !== currentColIndices['THỨ']) {
            const hStr = (headers[c] || '').toString().toUpperCase();
            if (hStr.includes('TC') || hStr.includes('TÍN') || hStr.includes('TIN')) {
              tcVal = val;
              break;
            }
          }
        }
      }

      const uniqueKey = codeStr + '_' + thuVal + '_' + thTiet + '_' + i;
      if (!seenMap.has(uniqueKey)) {
        seenMap.add(uniqueKey);
        allParsed.push({
          'MÃ LỚP': codeStr,
          'TÊN MÔN': (row[currentColIndices['TÊN MÔN']] || '').toString().trim(),
          'GIẢNG VIÊN': (row[currentColIndices['GIẢNG VIÊN']] || '').toString().trim(),
          'THỨ': thuVal,
          'TIẾT': thTiet || (htgd ? htgd : 'Tự do'),
          'PHÒNG': (row[currentColIndices['PHÒNG']] || '').toString().trim() || '—',
          'TC': tcVal,
          'LOẠI': htgd,
          'BASE_MA': baseMa,
          'GHI CHÚ': (row[currentColIndices['GHI CHÚ']] || '').toString().trim(),
          'NGÀY BĐ': (row[currentColIndices['NGÀY BĐ']] || '').toString().trim(),
          'NGÀY KT': (row[currentColIndices['NGÀY KT']] || '').toString().trim(),
          'CÁCH TUẦN': (row[currentColIndices['CÁCH TUẦN']] || '').toString().trim(),
          'MÃ LỚP LT': (row[currentColIndices['MÃ LỚP LT']] || '').toString().trim(),
        });
      }
    }
  }

  return sortClassesHierarchically(allParsed);
}

function sortClassesHierarchically(classList) {
  const ltMap = new Map();
  const thMap = new Map();

  classList.forEach(item => {
    const code = item['MÃ LỚP'].trim();
    const isTH = /\.\d+$/.test(code);
    
    if (!isTH) {
      ltMap.set(code, item);
    } else {
      const parentLT = item['MÃ LỚP LT'] || code.replace(/\.\d+$/, '');
      if (!thMap.has(parentLT)) thMap.set(parentLT, []);
      thMap.get(parentLT).push(item);
    }
  });

  const result = [];
  const allLTCodes = Array.from(new Set([...ltMap.keys(), ...thMap.keys()])).sort((a, b) => a.localeCompare(b));

  allLTCodes.forEach(ltCode => {
    const ltItem = ltMap.get(ltCode);
    if (ltItem) {
      result.push(ltItem);
    }
    
    const ths = thMap.get(ltCode) || [];
    ths.sort((a, b) => a['MÃ LỚP'].localeCompare(b['MÃ LỚP']));
    ths.forEach(thItem => {
      result.push(thItem);
    });
  });

  classList.forEach(item => {
    if (!result.some(r => r['MÃ LỚP'] === item['MÃ LỚP'])) {
      result.push(item);
    }
  });

  return result;
}

// === TIET PARSER & FORMATTER ===
function parseTiet(tietStr) {
  if (!tietStr) return [];
  
  let strVal = tietStr.toString().trim();
  
  // Handle range format with hyphen like '6 - 8', '6-8', '4 - 5', '1 - 5', '6 - 10'
  const rangeMatch = strVal.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    const res = [];
    if (start <= end) {
      for (let i = start; i <= end; i++) res.push(i);
      return res;
    }
  }

  // If string ends with '0' after digits (e.g. '67890' or '890'), '0' represents period 10!
  if (/^([1-9]+)0$/.test(strVal)) {
    strVal = strVal.slice(0, -1) + '10';
  } else if (strVal === '0') {
    return [10];
  }

  if (strVal.includes(',')) {
    return strVal.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)).sort((a,b)=>a-b);
  }

  let s = strVal.replace(/10/g, 'A');
  const arr = [];
  
  for (let i = 0; i < s.length; i++) {
    if (s[i] === 'A') {
      arr.push(10);
    } else if (!isNaN(parseInt(s[i], 10))) {
      arr.push(parseInt(s[i], 10));
    }
  }

  return Array.from(new Set(arr)).sort((a, b) => a - b);
}

function formatTietDisplay(tietStr) {
  const arr = parseTiet(tietStr);
  if (!arr || arr.length === 0) return tietStr || '—';
  if (arr.length === 1) return `Tiết ${arr[0]}`;
  
  const isConsecutive = arr.every((val, idx) => idx === 0 || val === arr[idx - 1] + 1);
  if (isConsecutive && arr.length >= 2) {
    return `Tiết ${arr[0]} - ${arr[arr.length - 1]}`;
  }
  return `Tiết ${arr.join(', ')}`;
}

// === HELPER FUNCTIONS ===
function getThNote(classData) {
  if (!classData) return '';
  const maLop = (typeof classData === 'string') ? classData : classData['MÃ LỚP'];
  const ghiChu = (typeof classData === 'object') ? classData['GHI CHÚ'] : '';
  const cachTuan = (typeof classData === 'object') ? classData['CÁCH TUẦN'] : '';

  let notes = [];
  if (ghiChu) notes.push(ghiChu);
  if (cachTuan && (cachTuan === '1' || cachTuan === '2' || cachTuan.includes('cách'))) {
    notes.push(`Cách ${cachTuan} tuần`);
  }
  if (maLop && maLop.endsWith('.2')) notes.push('Học sau .1 một tuần');
  if (maLop && maLop.endsWith('.3')) notes.push('Học sau .1 hai tuần');

  return notes.join(' • ');
}

function getSortableName(name) {
  if (!name) return { ten: '', hoDem: '' };
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { ten: parts[0], hoDem: '' };
  const ten = parts.pop();
  return { ten, hoDem: parts.join(' ') };
}

function generateId() {
  return Date.now() + Math.random().toString(36).substring(2, 7);
}
