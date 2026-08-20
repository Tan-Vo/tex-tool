# ⚡ TEX-TOOL | UIT Schedule Planner Pro

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E.svg?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6.svg?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-emerald.svg?style=for-the-badge)](#)

**TEX-TOOL | UIT Schedule Planner Pro** is a high-performance, modern web application designed for students of the University of Information Technology (UIT) to plan, visualize, and automate course registration schedules smoothly.

---

## 🌟 Key Features

- 🗓️ **Smart 10-Period Timetable Grid**: High-precision grid layout (Tiết 1 – 10, Thứ 2 – 7) with auto-fitting typography and zero layout shifts.
- 📌 **Dedicated Unscheduled Section**: Dedicated bottom panel (`📌 Môn chưa xếp lịch / Tiết tự do`) for physical education (`PE232`), online courses, and electives.
- 📊 **Smart Excel File Parser**: Automatically parses UIT course schedule Excel files (`.xlsx`, `.xls`), detects column aliases (`MALOP`, `TENMH`, `TENGV`, `SOTC`, `THU`, `TIET`, `NGÀY BĐ`, `NGÀY KT`), and handles merged cells.
- ⚡ **DKHP Auto-Script Generator**: Generates 100% accurate, console-ready course registration scripts (`DangKy(monDangKy)`) tailored for `dkhp.uit.edu.vn`.
- 📁 **Multi-Plan Management**: Create, duplicate, rename, and manage multiple schedule options (`Phương án 1, 2, 3...`) stored in IndexedDB and LocalStorage.
- 🎨 **Minimal Ultra-Clean UI**: Seamless Dark / Light theme toggle with 0ms hardware GPU 3D pointer cursor tracking.
- 📤 **Export & Print Support**: Export high-resolution PNG timetable screenshots and PDF print-ready layouts.

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 Custom Design System
- **File Parsing**: SheetJS (`xlsx.full.min.js`)
- **Screenshot Capture**: `html2canvas`
- **Storage**: IndexedDB & HTML5 Web Storage API
- **Deployment**: Static Web Hosting / GitHub Pages / Vercel

---

## 🚀 Quick Start & Usage

### 1. Clone the Repository

```bash
git clone https://github.com/Tan-Vo/tex.git
cd tex
```

### 2. Run Locally

Open `index.html` directly in any modern web browser (Chrome, Edge, Firefox, Safari) or use a local static server:

```bash
npx serve .
```

Then visit `http://localhost:3000`.

---

## 📖 How to Use TEX-TOOL

1. **Upload Excel Schedule**: Click `Tải File TKB` and select your UIT university course Excel file (`.xlsx`).
2. **Select Classes**: Click any course in the **Lớp mở** list to add it to your schedule.
3. **Manage Options**: Use `+ Mới` or `⧉ Nhân bản` to try out different timetable options.
4. **Generate DKHP Script**: Switch to the `⚡ DKHP Script` tab, click `📋 Copy Script`, and paste it into the Developer Console (`F12`) on `dkhp.uit.edu.vn`.
5. **Export / Print**: Click `Ảnh TKB` or `In PDF` to download your finished schedule!

---

## ⚡ DKHP Console Script Format

TEX-TOOL automatically generates registration scripts matching the exact standard format:

```javascript
var monDangKy = `
IE104.R12.CNVN
IE104.R12.CNVN.1
SE347.R11
`;

var successLog = (message) => console.log('%c' + message, 'font-weight:bold; color:green;');
var errorLog = (message) => console.log('%c' + message, 'font-weight:bold; color:red;');

DangKy(monDangKy);
```

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are always welcome!  
Feel free to open an issue or submit a pull request on the [issues page](https://github.com/Tan-Vo/tex/issues).

---

## 📝 License

Distributed under the MIT License.

<p align="center">
  Developed with ❤️ by <a href="https://github.com/Tan-Vo">Tan-Vo</a>
</p>
