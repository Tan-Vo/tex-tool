// === TEX-TOOL | DKHP SCRIPT GENERATOR (MATCHING USER SCRIPT TEMPLATE 100%) ===
// Generates JavaScript code matching the exact DangKy(monDangKy) script format provided by user

function generateDkhpScript(classCodes) {
  const classListText = classCodes.join('\n');
  return `var monDangKy = \`
${classListText}
\`;

var successLog = (message) => console.log('%c' + message, 'font-weight:bold; color:green;');
var errorLog = (message) => console.log('%c' + message, 'font-weight:bold; color:red;');

DangKy(monDangKy);

function DangKy(monDangKyString) {
  try {
    var listMonDangKy = monDangKyString.trim().split('\\n').map((it) => it.trim());
    
    var allRows = [...document.querySelectorAll('form table tr')];

    var rowsToDangKy = allRows.filter((it) => listMonDangKy.includes(it.querySelector('td:nth-child(2)')?.textContent?.trim()));
    
    rowsToDangKy.forEach((it, index) => {
      it.querySelector('td:first-child input[type="checkbox"]')?.click();
      var tenLop = it.querySelector('td:nth-child(2)')?.textContent?.trim();
      successLog((index + 1) + '.Đã chọn lớp ' + tenLop);
    });
  } catch {
    errorLog('Chọn lớp không thành công! Bạn tự chọn lớp đi nhé!');
  }
}`;
}

function generateBookmarklet(classCodes) {
  const script = generateDkhpScript(classCodes);
  return 'javascript:' + encodeURIComponent('(function(){' + script.replace(/\/\/.*/gm, '').replace(/\n/g, ' ').replace(/\s+/g, ' ') + '})()');
}

function updateDkhpPanel(myClasses) {
  const preview = document.getElementById('scriptPreview');
  const countEl = document.getElementById('dkhpClassCount');
  const btnCopyScript = document.getElementById('btnCopyScript');
  const btnCopyBookmarklet = document.getElementById('btnCopyBookmarklet');
  
  if (!preview || !countEl) return;
  
  const classCodes = myClasses.map(c => c['MÃ LỚP']).sort();
  countEl.textContent = classCodes.length;
  
  if (classCodes.length === 0) {
    preview.innerHTML = '<code>// Chọn lớp để tạo script...</code>';
  } else {
    const scriptText = generateDkhpScript(classCodes);
    preview.textContent = scriptText;
  }
  
  if (btnCopyScript) {
    btnCopyScript.onclick = () => {
      if (classCodes.length === 0) return alert("TEX-TOOL: Vui lòng chọn ít nhất 1 lớp để tạo script!");
      const scriptText = generateDkhpScript(classCodes);
      navigator.clipboard.writeText(scriptText).then(() => {
        const orig = btnCopyScript.textContent;
        btnCopyScript.textContent = "✅ Đã Copy Script!";
        setTimeout(() => { btnCopyScript.textContent = orig; }, 1500);
      });
    };
  }
  
  if (btnCopyBookmarklet) {
    btnCopyBookmarklet.onclick = () => {
      if (classCodes.length === 0) return alert("TEX-TOOL: Vui lòng chọn ít nhất 1 lớp để tạo Bookmarklet!");
      const bookmarkletText = generateBookmarklet(classCodes);
      navigator.clipboard.writeText(bookmarkletText).then(() => {
        const orig = btnCopyBookmarklet.textContent;
        btnCopyBookmarklet.textContent = "✅ Đã Copy Bookmarklet!";
        setTimeout(() => { btnCopyBookmarklet.textContent = orig; }, 1500);
      });
    };
  }
}
