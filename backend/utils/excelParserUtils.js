import ExcelJS from 'exceljs';
import fs from 'fs';

export const parseUniversitiesFromExcel = async (filePath) => {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const sheet = workbook.getWorksheet('Universities');

        if (!sheet) {
            throw new Error('Sheet "Universities" not found in Excel file');
        }

        const universities = [];
        const rows = sheet.getSheetValues();

        for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[3]) continue; 

            const excelId = row[1];     // idTruong
            const code = row[2];        // code
            const fullName = row[3];    // fullName
            const region = row[4];      // region
            const address = row[5];     // address
            const phone1 = row[6];      // phone1
            const phone2 = row[7];      // phone2
            const website = row[8];     // website

            const phones = [];
            if (phone1) phones.push(phone1.toString().trim());
            if (phone2) phones.push(phone2.toString().trim());

            universities.push({
                excelId: excelId ? Number(excelId) : null,
                name: fullName || '',
                code: code ? code.toString().trim() : '',
                description: '',
                address: address ? address.toString().trim() : '',
                website: website ? website.toString().trim() : '',
                region: region ? region.toString().trim() : '',
                phone: phones,
                rowNumber: i
            });
        }

        return universities;
    } catch (error) {
        throw new Error(`Excel parsing error: ${error.message}`);
    }
};

export const validateBulkUniversities = (universities) => {
    const errors = [];

    universities.forEach((uni, index) => {
        if (!uni.name || uni.name.trim() === '') {
            errors.push(`Row ${uni.rowNumber || index + 1}: Name is required`);
        }
        if (!uni.code || uni.code.trim() === '') {
            errors.push(`Row ${uni.rowNumber || index + 1}: Code (shortName) is required`);
        }
        if (uni.name && uni.name.length > 200) {
            errors.push(`Row ${uni.rowNumber || index + 1}: Name must be less than 200 characters`);
        }
        if (uni.code && uni.code.length > 50) {
            errors.push(`Row ${uni.rowNumber || index + 1}: Code must be less than 50 characters`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        validRecords: universities.filter(u => u.name && u.code)
    };
};

export const createSampleUniversityFile = async (filePath) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Universities');

    sheet.columns = [
        { header: 'idTruong', key: 'id', width: 10 },
        { header: 'shortName', key: 'shortName', width: 15 },
        { header: 'fullName', key: 'fullName', width: 50 },
        { header: 'address', key: 'address', width: 40 },
        { header: 'phone1', key: 'phone1', width: 15 },
        { header: 'phone2', key: 'phone2', width: 15 },
        { header: 'website', key: 'website', width: 30 },
    ];

    sheet.addRows([
        {
            id: 1,
            shortName: 'ĐHBK',
            fullName: 'Đại học Bách Khoa Hà Nội',
            address: 'Số 1, Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
            phone1: '(024) 3868 0181',
            phone2: '(024) 3869 0000',
            website: 'https://www.hust.edu.vn'
        },
        {
            id: 2,
            shortName: 'ĐHSP',
            fullName: 'Đại học Sư phạm Hà Nội',
            address: 'Xuân Thủy, Cầu Giấy, Hà Nội',
            phone1: '(024) 3739 0999',
            phone2: '',
            website: 'https://www.hnue.edu.vn'
        },
        {
            id: 3,
            shortName: 'ĐHQG',
            fullName: 'Đại học Quốc Gia Hà Nội',
            address: 'Âu Cơ, Tây Hồ, Hà Nội',
            phone1: '(024) 3755 0666',
            phone2: '',
            website: 'https://www.vnu.edu.vn'
        }
    ]);

    await workbook.xlsx.writeFile(filePath);
};

export const parseSubjectsFromExcel = async (filePath) => {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const sheet = workbook.getWorksheet('Subjects') || workbook.worksheets[0];

        if (!sheet) {
            throw new Error('Sheet "Subjects" not found in Excel file');
        }

        const subjects = [];
        const rows = sheet.getSheetValues();

        for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[2]) continue; 

            const name = row[2]?.toString().trim(); // Column B (name)

            if (name) {
                subjects.push({
                    name: name,
                    rowNumber: i
                });
            }
        }

        return subjects;
    } catch (error) {
        throw new Error(`Excel parsing error: ${error.message}`);
    }
};
