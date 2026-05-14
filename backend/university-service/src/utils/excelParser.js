import xlsx from 'xlsx';

const firstValue = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return String(row[key]).trim();
    }
  }
  return '';
};

export const parseExcelRows = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];
  return xlsx.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
};

export const parseUniversitiesFromExcel = (filePath) =>
  parseExcelRows(filePath).map((row) => ({
    name: firstValue(row, ['name', 'Name', 'Tên trường', 'Ten truong', 'University', 'Trường']),
    code: firstValue(row, ['code', 'Code', 'Mã trường', 'Ma truong', 'Mã']),
    description: firstValue(row, ['description', 'Description', 'Mô tả', 'Mo ta']),
    address: firstValue(row, ['address', 'Address', 'Địa chỉ', 'Dia chi']),
    website: firstValue(row, ['website', 'Website']),
    region: firstValue(row, ['region', 'Region', 'Khu vực', 'Khu vuc', 'Tỉnh/Thành', 'Tinh/Thanh']),
    phone: firstValue(row, ['phone', 'Phone', 'Số điện thoại', 'So dien thoai']),
  }));

export const validateBulkUniversities = (universities = []) => {
  const errors = [];
  const validRecords = [];

  universities.forEach((university, index) => {
    if (!university.name || !university.code) {
      errors.push(`Dòng ${index + 1}: thiếu tên trường hoặc mã trường`);
      return;
    }
    validRecords.push({
      ...university,
      name: university.name.trim(),
      code: university.code.trim(),
      phone: university.phone ? [university.phone] : [],
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    validRecords,
  };
};

export const mapUniversityMajorRows = (filePath) =>
  parseExcelRows(filePath).map((row) => ({
    majorGroupName: firstValue(row, ['majorGroupName', 'Major Group', 'Nhóm ngành', 'Nhom nganh', 'majorCategory']),
    universityName: firstValue(row, ['universityName', 'University', 'Tên trường', 'Ten truong']),
    majorName: firstValue(row, ['majorName', 'Major', 'Tên ngành', 'Ten nganh']),
    tuition: firstValue(row, ['tuition', 'Tuition', 'Học phí', 'Hoc phi']),
    score: firstValue(row, ['score', 'Score', 'Điểm chuẩn', 'Diem chuan', 'admissionScore']),
    subjects: firstValue(row, ['subjects', 'Subjects', 'Tổ hợp', 'To hop', 'admissionMethods']),
  }));
