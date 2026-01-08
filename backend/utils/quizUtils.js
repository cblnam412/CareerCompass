export const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};

export const calculatePersonalityResult = (answers, questions) => {
    const resultScores = {};
    
    try {
        answers.forEach((answerIndex, questionIndex) => {
            if (questionIndex < questions.length) {
                const question = questions[questionIndex];
                
                if (question.options && question.options[answerIndex]) {
                    const selectedOption = question.options[answerIndex];
                    
                    if (selectedOption.result) {
                        resultScores[selectedOption.result] = 
                            (resultScores[selectedOption.result] || 0) + (selectedOption.score || 1);
                    }
                }
            }
        });
        
        return resultScores;
    } catch (error) {
        console.error('Error calculating personality result:', error);
        return resultScores;
    }
};

export const determineMainResult = (resultScores) => {
    if (Object.keys(resultScores).length === 0) {
        return null;
    }
    
    return Object.keys(resultScores).reduce((prev, current) => 
        resultScores[current] > resultScores[prev] ? current : prev
    );
};

export const validatePersonalityQuizData = (data) => {
    const errors = [];
    
    if (!data.title || data.title.trim() === '') {
        errors.push('Tiêu đề là bắt buộc');
    }
    
    if (!data.type || !['MBTI', 'Holland'].includes(data.type)) {
        errors.push('Loại trắc nghiệm phải là MBTI hoặc Holland');
    }
    
    if (data.title && data.title.length > 200) {
        errors.push('Tiêu đề không được vượt quá 200 ký tự');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

export const validateQuestionData = (data) => {
    const errors = [];
    
    if (!data.content || data.content.trim() === '') {
        errors.push('Nội dung câu hỏi là bắt buộc');
    }
    
    if (!data.options || !Array.isArray(data.options) || data.options.length < 2) {
        errors.push('Phải có ít nhất 2 lựa chọn');
    }
    
    if (data.options && Array.isArray(data.options)) {
        data.options.forEach((option, index) => {
            if (!option.text || option.text.trim() === '') {
                errors.push(`Lựa chọn ${index + 1} phải có nội dung`);
            }
            
            if (!option.result) {
                errors.push(`Lựa chọn ${index + 1} phải có kết quả`);
            }
        });
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

export const getQuizStats = (quizId, attempts) => {
    const stats = {
        totalAttempts: attempts.length,
        averageScore: 0,
        resultDistribution: {},
        attemptsByDate: {}
    };
    
    if (attempts.length === 0) {
        return stats;
    }
    
    attempts.forEach(attempt => {
        if (attempt.resultScore) {
            Object.keys(attempt.resultScore).forEach(result => {
                stats.resultDistribution[result] = 
                    (stats.resultDistribution[result] || 0) + 1;
            });
        }
        
        const date = new Date(attempt.attemptedAt).toISOString().split('T')[0];
        stats.attemptsByDate[date] = (stats.attemptsByDate[date] || 0) + 1;
    });
    
    return stats;
};

export default {
    isValidObjectId,
    calculatePersonalityResult,
    determineMainResult,
    validatePersonalityQuizData,
    validateQuestionData,
    getQuizStats
};
