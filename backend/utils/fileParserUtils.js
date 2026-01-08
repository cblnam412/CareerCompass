import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const parseTextFile = (filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        const majors = lines.map((line, index) => {
            const parts = line.split('|').map(part => part.trim());
            
            if (parts.length === 1) {
                return {
                    name: parts[0] || null,
                    category: '', 
                    description: '',
                    lineNumber: index + 1
                };
            } else if (parts.length >= 2) {
                const [name, category, description] = parts;
                return {
                    name: name || null,
                    category: category || '',
                    description: description || '',
                    lineNumber: index + 1
                };
            }
        });
        
        const errors = [];
        majors.forEach(major => {
            if (!major.name) {
                errors.push(`Line ${major.lineNumber}: Name is required`);
            }
        });
        
        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }
        
        return majors;
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`File not found: ${filePath}`);
        }
        throw error;
    }
};

export const validateBulkMajors = (majors) => {
    const errors = [];
    
    majors.forEach((major, index) => {
        if (!major.name || major.name.trim() === '') {
            errors.push(`Record ${index + 1}: Name is required`);
        }    
        if (major.name && major.name.length > 100) {
            errors.push(`Record ${index + 1}: Name must be less than 100 characters`);
        }
        if (major.category && major.category.length > 100) {
            errors.push(`Record ${index + 1}: Category must be less than 100 characters`);
        }
        if (major.description && major.description.length > 500) {
            errors.push(`Record ${index + 1}: Description must be less than 500 characters`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors,
        validRecords: majors.filter(m => m.name)
    };
};

export const exportToCSV = (majors) => {
    const header = 'Name,Category,Description\n';
    const rows = majors.map(major => 
        `"${major.name.replace(/"/g, '""')}","${major.category.replace(/"/g, '""')}","${(major.description || '').replace(/"/g, '""')}"`
    );
    return header + rows.join('\n');
};

export const createSampleFile = (filePath) => {
    const sampleContent = `Công Nghệ Thông Tin|Công Nghệ|Ngành học về phần mềm, lập trình và hệ thống thông tin
Kỹ Thuật Phần Mềm|Công Nghệ|Ngành học chuyên sâu về phát triển phần mềm
Khoa Học Máy Tính|Công Nghệ|Ngành học về lý thuyết và ứng dụng máy tính
Kinh Tế|Kinh Tế|Ngành học về kinh tế vi mô và vĩ mô
Quản Trị Kinh Doanh|Kinh Tế|Ngành học về quản lý doanh nghiệp
Kế Toán|Kinh Tế|Ngành học về kế toán và kiểm toán
Y Dược|Y Sinh|Ngành học về y học và dược học
Điều Dưỡng|Y Sinh|Ngành học về chăm sóc sức khỏe
Luật|Xã Hội Nhân Văn|Ngành học về luật pháp
Giáo Dục|Xã Hội Nhân Văn|Ngành học về giáo dục và sư phạm`;
    
    fs.writeFileSync(filePath, sampleContent, 'utf-8');
    return filePath;
};
