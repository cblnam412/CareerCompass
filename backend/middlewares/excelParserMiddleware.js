import ExcelJS from 'exceljs';

export const parseExcelData = async (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        const sheet = workbook.getWorksheet('VnExpress_Data') || workbook.worksheets[0];

        if (!sheet) {
            return res.status(400).json({
                success: false,
                message: 'No worksheet found in Excel file'
            });
        }

        const records = [];
        const rows = sheet.getSheetValues();

        for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[2]) continue; 
            // 1: ID Nhóm
            // 2: Nhóm Ngành
            // 3: Tên Ngành
            // 4: Mã Ngành
            // 5: Điểm Chuẩn
            // 6: Tổ Hợp
            // 7: Học Phí
            // 8: Tên Trường

            records.push({
                majorGroupName: row[2] ? String(row[2]).trim() : '',
                majorName: row[3] ? String(row[3]).trim() : '',
                majorCode: row[4] ? String(row[4]).trim() : '',
                score: row[5] ? String(row[5]).trim() : '',
                subjects: row[6] ? String(row[6]).trim() : '',
                tuition: row[7] ? String(row[7]).trim() : '0',
                universityName: row[8] ? String(row[8]).trim() : ''
            });
        }

        req.excelData = records;
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Excel parsing error: ${error.message}`
        });
    }
};
