const csvEscape = (value) => {
  const text = value === undefined || value === null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

export const exportToCSV = (majors = []) => {
  const rows = [['name', 'category', 'description']];
  majors.forEach((major) => rows.push([major.name, major.category, major.description]));
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
};
