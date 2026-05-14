import fs from 'fs';

export const parseTextFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8').trim();
  if (!content) return [];

  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\t|\||,/).map((part) => part.trim());
      return {
        name: parts[0] || '',
        category: parts[1] || '',
        description: parts.slice(2).join(', ') || '',
      };
    });
};

export const validateBulkMajors = (majors = []) => {
  const errors = [];
  const validRecords = [];

  majors.forEach((major, index) => {
    if (!major.name || !major.category) {
      errors.push(`Dòng ${index + 1}: thiếu tên ngành hoặc nhóm ngành`);
      return;
    }
    validRecords.push(major);
  });

  return {
    isValid: errors.length === 0,
    errors,
    validRecords,
  };
};
