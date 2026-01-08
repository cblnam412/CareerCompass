const axios = require('axios');
const cheerio = require('cheerio');
const ExcelJS = require('exceljs');
const fs = require('fs');

// --- HÀM 1: Lấy danh sách ngành (LOGIC: VÉT CẠN - HYBRID) ---
async function fetchMajorsByUniversity(uniId) {
    const url = `https://diemthi.vnexpress.net/tra-cuu-dai-hoc/loadbenchmark/id/${uniId}/year/-1/sortby/1/block_name/all`;
    const arr = [];
    
    try {
        const { data } = await axios.get(url);

        if (data.error && data.error === 1) {
            console.log(`[Info] Trường ID ${uniId}: Không có dữ liệu ngành.`);
            return arr; 
        }

        const $ = cheerio.load(data.html);

        $('tr.university__benchmark:has(a[href*="/nganh/id/"])').each((_, el) => {
            const tds = $(el).find('td');

            // 1. Tên & Mã ngành (Cột index 1)
            const secondTd = tds.eq(1);
            const aTag = secondTd.find('a[href*="/nganh/id/"]');
            
            const href = aTag.attr('href') || '';
            const idNganh = href.match(/id\/(\d+)/)?.[1] || null;
            const tenNganh = aTag.text().trim();
            const maNganh = secondTd.find('span').last().text().trim();

            let toHopMon = '';
            let hocPhi = '';

            // 2. QUÉT DỮ LIỆU THÔNG MINH
            tds.each((index, td) => {
                if (index < 2) return; // Bỏ qua 2 cột đầu

                const rawText = $(td).text().trim();
                const textLower = rawText.toLowerCase();

                // --- A. TÌM TỔ HỢP MÔN ---
                // Regex tìm: Chữ in hoa + 2 số (A00, D01, V00...)
                if (/[A-Z]\d{2}/.test(rawText)) {
                    toHopMon = rawText;
                }

                // --- B. TÌM HỌC PHÍ (ƯU TIÊN 1: TỪ KHÓA CHUẨN) ---
                if (!hocPhi) {
                    // Check 1: Có chứa số tiền lớn định dạng phẩy (vd: 25,000,000)
                    if (rawText.includes(',000')) {
                        hocPhi = rawText;
                    }
                    // Check 2: Chứa từ khóa tiền tệ
                    else if (textLower.includes('triệu') || textLower.includes('đồng') || textLower.includes('học phí')) {
                        hocPhi = rawText;
                    }
                }
            });

            if (idNganh) {
                arr.push({ 
                    idNganh, 
                    maNganh, 
                    tenNganh, 
                    toHopMon: toHopMon || '', 
                    hocPhi: hocPhi || '' 
                });
            }
        });

    } catch (error) {
        console.error(`[Lỗi] Fetch URL ${url} thất bại:`, error.message);
    }
    return arr;
}

// --- HÀM 2: Lấy lịch sử điểm chuẩn ---
async function fetchScoresByMajor(uniId, idNganh) {
    const api = `https://diemthi.vnexpress.net/diem-chuan/nganh/loadchart/${idNganh}/cid/${uniId}/id/${uniId}`;
    try {
        const res = await axios.get(api);
        if (res.data && Array.isArray(res.data.data)) {
            return res.data.data.map(item => ({
                nam: item.name,
                diemchuan: item.y
            }));
        }
    } catch (err) { 
        // Lỗi lấy điểm không chặn luồng chính
    }
    return [];
}

// --- HÀM 3: Chạy chính ---
async function runSheet2() {
    console.log("--- BẮT ĐẦU CÀO DỮ LIỆU (LOGIC: VÉT CẠN) ---");
    
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile('Uni.xlsx');
    } catch (e) {
        console.error("LỖI: Không tìm thấy file 'Uni.xlsx'.");
        return;
    }

    const sheet1 = workbook.getWorksheet('Universities');
    if (!sheet1) return;

    const oldSheet = workbook.getWorksheet('Majors');
    if (oldSheet) workbook.removeWorksheet(oldSheet.id);

    const sheet2 = workbook.addWorksheet('Majors'); 

    sheet2.columns = [
        { header: 'idTruong', key: 'idTruong', width: 10 },
        { header: 'idNganh', key: 'idNganh', width: 10 },
        { header: 'maNganh', key: 'maNganh', width: 15 },
        { header: 'tenNganh', key: 'tenNganh', width: 40 },
        { header: 'toHopMon', key: 'toHopMon', width: 25 }, 
        { header: 'nam', key: 'nam', width: 10 },
        { header: 'diemchuan', key: 'diemchuan', width: 10 },
        { header: 'hocPhi', key: 'hocPhi', width: 50 } 
    ];

    const rows = sheet1.getRows(2, sheet1.rowCount - 1) || [];
    
    for (let row of rows) {
        const uniId = row.getCell(1).value; 
        const fullName = row.getCell(3).value; 

        if (!uniId) continue;

        console.log(`Đang xử lý: ${fullName} (ID: ${uniId})...`);

        // Lấy dữ liệu ngành (đã bao gồm Subject + Tuition)
        const majors = await fetchMajorsByUniversity(uniId);

        if (majors.length === 0) {
            console.log(`   -> Không tìm thấy ngành.`);
            continue;
        }

        // Lấy điểm chuẩn từng ngành
        for (let major of majors) {
            const scores = await fetchScoresByMajor(uniId, major.idNganh);

            // Nếu có dữ liệu điểm -> Ghi từng năm
            if (scores.length > 0) {
                for (let s of scores) {
                   sheet2.addRow({
                        idTruong: uniId,
                        idNganh: major.idNganh,
                        maNganh: major.maNganh,
                        tenNganh: major.tenNganh,
                        toHopMon: major.toHopMon,
                        hocPhi: major.hocPhi,     
                        nam: s.nam,
                        diemchuan: s.diemchuan    
                    });
                }
            } 
            // QUAN TRỌNG: Nếu KHÔNG có điểm (scores = []), VẪN PHẢI GHI 1 DÒNG
            // Đây có thể là lý do chính khiến dữ liệu bị mất (từ 21k xuống 15k)
            else {
                sheet2.addRow({
                    idTruong: uniId,
                    idNganh: major.idNganh,
                    maNganh: major.maNganh,
                    tenNganh: major.tenNganh,
                    toHopMon: major.toHopMon,
                    hocPhi: major.hocPhi,
                    nam: '',
                    diemchuan: ''
                });
            }
        }
    }

    await workbook.xlsx.writeFile('Uni.xlsx');
    console.log("------------------------------------------------");
    console.log("HOÀN TẤT! Đã dùng logic 'Vét cạn' để đảm bảo không mất dữ liệu.");
}

runSheet2();