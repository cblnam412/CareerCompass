const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');

const BASE_URL = 'https://diemthi.vnexpress.net/tra-cuu-dai-hoc';

async function crawlMajorGroup(page, majorId) {
    const url = `${BASE_URL}/nhom-nganh/id/${majorId}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // 1. Tự động nhấn nút "Xem thêm" cho đến khi hết dữ liệu
    while (true) {
        try {
            const loadMoreBtn = await page.$('.btn-viewmore, #load_more_major'); // Selector nút xem thêm
            if (loadMoreBtn) {
                await loadMoreBtn.click();
                await new Promise(r => setTimeout(r, 1000)); // Đợi dữ liệu tải thêm
            } else {
                break;
            }
        } catch (e) {
            break;
        }
    }

    // 2. Trích xuất dữ liệu từ trình duyệt
    const data = await page.evaluate((majorId) => {
        const results = [];
        
        // Lấy tên nhóm ngành
        const titleEl = document.querySelector('.university__header-title');
        let groupName = 'Không xác định';
        if (titleEl) {
            const clone = titleEl.cloneNode(true);
            const icon = clone.querySelector('i');
            if (icon) icon.remove();
            groupName = clone.innerText.trim();
            // Loại bỏ "Nhóm ngành" ở đầu
            groupName = groupName.replace(/^Nhóm\s+ngành\s*/, '').trim();
        }

        // Duyệt các hàng trong bảng
        const rows = document.querySelectorAll('table tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 6) {
                // Cột Tên & Mã (Index 1)
                const tdMajor = cells[1];
                // Lấy strong không bị ẩn (display: none)
                const strongs = Array.from(tdMajor.querySelectorAll('strong'));
                const visibleStrong = strongs.find(s => s.style.display !== 'none');
                const majorName = visibleStrong ? visibleStrong.innerText.trim() : '';
                const majorCode = tdMajor.querySelector('span') ? tdMajor.querySelector('span').innerText.trim() : '';

                // Cột Điểm chuẩn (Index 2)
                const score = cells[2].querySelector('span') ? cells[2].querySelector('span').innerText.trim() : cells[2].innerText.trim();

                // Cột Tổ hợp (Index 3)
                const subjects = cells[3].innerText.trim();

                // Cột Học phí (Index 4)
                const tuition = cells[4].innerText.trim();

                // Cột Tên trường (Index 5)
                const uniLink = cells[5].querySelector('.university__benchmark-name a');
                const universityName = uniLink ? uniLink.innerText.trim() : '';

                if (universityName) {
                    results.push({
                        majorGroupId: majorId,
                        majorGroupName: groupName,
                        majorName: majorName,
                        majorCode: majorCode,
                        score: score,
                        subjects: subjects,
                        tuition: tuition,
                        universityName: universityName
                    });
                }
            }
        });
        return results;
    }, majorId);

    return data;
}

(async () => {
    const browser = await puppeteer.launch({ headless: "new" }); // Mở trình duyệt ẩn
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('VnExpress_Data');

    sheet.columns = [
        { header: 'ID Nhóm', key: 'majorGroupId', width: 10 },
        { header: 'Nhóm Ngành', key: 'majorGroupName', width: 25 },
        { header: 'Tên Ngành', key: 'majorName', width: 35 },
        { header: 'Mã Ngành', key: 'majorCode', width: 12 },
        { header: 'Điểm Chuẩn', key: 'score', width: 12 },
        { header: 'Tổ Hợp', key: 'subjects', width: 20 },
        { header: 'Học Phí', key: 'tuition', width: 15 },
        { header: 'Tên Trường', key: 'universityName', width: 40 },
    ];

    console.log('🚀 Bắt đầu quá trình cào dữ liệu thực tế...');

    for (let i = 1; i <= 40; i++) {
        try {
            console.log(` đang xử lý Nhóm ID: ${i}...`);
            const groupData = await crawlMajorGroup(page, i);
            
            if (groupData.length > 0) {
                console.log(`   ✓ Lấy được ${groupData.length} bản ghi.`);
                groupData.forEach(row => sheet.addRow(row));
            } else {
                console.log(`   ⚠ Không có dữ liệu.`);
            }
        } catch (err) {
            console.error(`   ✗ Lỗi tại ID ${i}:`, err.message);
        }
    }

    await workbook.xlsx.writeFile('KetQuaVnExpress_Full.xlsx');
    await browser.close();
    console.log('\n✅ HOÀN THÀNH! File "KetQuaVnExpress_Full.xlsx" đã được lưu.');
})();