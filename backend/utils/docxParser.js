import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

export const parseSubjectCombinationsFromDocx = async (filePath) => {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        let fullText = result.value;
        
        const combinations = [];
        const errors = [];
        
        fullText = fullText.replace(/([A-Z][0-9]{2})\s*:/g, '\n$1 :');
        
        const lines = fullText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        let lineNumber = 0;
        
        lines.forEach(line => {
            lineNumber++;
            const match = line.match(/^([A-Z][0-9]{2})\s*:\s*(.+)$/);
            
            if (match) {
                const combinationCode = match[1].trim();
                let subjectString = match[2].trim();
                
                const subjects = subjectString
                    .split(/\s*[–\-]\s*/)
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !s.match(/^[A-Z0-9]+$/));
                
                if (subjects.length > 0) {
                    combinations.push({
                        combinationName: combinationCode,
                        subjects: subjects
                    });
                } else if (subjectString.length > 0) {
                    errors.push({
                        line: lineNumber,
                        content: line,
                        reason: 'Không tìm thấy môn học hợp lệ'
                    });
                }
            } else if (line.length > 0) {
                console.warn(`Line ${lineNumber} không match format: ${line}`);
            }
        });
        
        if (combinations.length === 0) {
            return {
                success: false,
                message: 'Không tìm thấy tổ hợp môn nào. Kiểm tra format: [A-Z][0-9]{2} : MÔN 1 – MÔN 2 – MÔN 3',
                data: [],
                count: 0,
                errors: errors,
                debugText: fullText.substring(0, 300)
            };
        }
        
        return {
            success: true,
            data: combinations,
            count: combinations.length,
            errors: errors.length > 0 ? errors : null
        };
        
    } catch (error) {
        console.error('Parse docx error:', error);
        return {
            success: false,
            message: 'Lỗi khi parse file docx',
            error: error.message
        };
    }
};

export const validateSubjectCombinations = (combinations) => {
    const errors = [];
    
    combinations.forEach((combo, index) => {
        if (!combo.combinationName || combo.combinationName.trim().length === 0) {
            errors.push({
                index,
                field: 'combinationName',
                message: 'Mã tổ hợp không được để trống'
            });
        }
        
        if (!Array.isArray(combo.subjects) || combo.subjects.length === 0) {
            errors.push({
                index,
                field: 'subjects',
                message: 'Phải có ít nhất 1 môn học'
            });
        }
        
        if (Array.isArray(combo.subjects)) {
            combo.subjects.forEach((subject, subIndex) => {
                if (!subject || subject.trim().length === 0) {
                    errors.push({
                        index,
                        field: `subjects[${subIndex}]`,
                        message: 'Tên môn học không được để trống'
                    });
                }
            });
        }
    });
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
};