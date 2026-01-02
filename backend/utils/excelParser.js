import XLSX from 'xlsx';


export const parseExcelQuestions = (fileBuffer) => {
    try {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        const questions = [];
        
        data.forEach((row, index) => {
            const cellValue = Object.values(row)[0];
            
            if (!cellValue || typeof cellValue !== 'string' || cellValue.trim() === '') {
                console.warn(`Row ${index + 2}: Dòng trống hoặc không hợp lệ, bỏ qua`);
                return;
            }
            
            const parts = cellValue.split(':').map(part => part.trim());
            
            if (parts.length < 6) {
                console.warn(`Row ${index + 2}: Format không hợp lệ (cần 6 phần). Bỏ qua.`);
                return;
            }
            
            const question = {
                question: parts[0],
                options: [parts[1], parts[2], parts[3], parts[4]],
                answer: parts[5]
            };
            
            if (!question.options.includes(question.answer)) {
                console.warn(`Row ${index + 2}: Đáp án không nằm trong các lựa chọn. Bỏ qua.`);
                return;
            }
            
            questions.push(question);
        });
        
        return questions;
        
    } catch (error) {
        throw new Error(`Lỗi parse file Excel: ${error.message}`);
    }
};


export const validateQuestions = (questions) => {
    const errors = [];
    
    if (!Array.isArray(questions) || questions.length === 0) {
        errors.push('Questions phải là mảng và không được trống');
        return { valid: false, errors };
    }
    
    questions.forEach((q, index) => {
        if (!q.question || typeof q.question !== 'string' || q.question.trim() === '') {
            errors.push(`Question ${index + 1}: Nội dung câu hỏi không hợp lệ`);
        }
        
        if (!Array.isArray(q.options) || q.options.length !== 4) {
            errors.push(`Question ${index + 1}: Cần đúng 4 lựa chọn`);
        }
        
        if (!q.answer || typeof q.answer !== 'string' || q.answer.trim() === '') {
            errors.push(`Question ${index + 1}: Đáp án không hợp lệ`);
        }
        
        if (q.options && !q.options.includes(q.answer)) {
            errors.push(`Question ${index + 1}: Đáp án không nằm trong các lựa chọn`);
        }
    });
    
    return {
        valid: errors.length === 0,
        errors
    };
};
