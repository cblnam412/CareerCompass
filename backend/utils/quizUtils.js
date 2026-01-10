export const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};

export const calculateMBTIResult = (answers, questions) => {
    const dimensions = {
        'E/I': { E: 0, I: 0 },
        'S/N': { S: 0, N: 0 },
        'T/F': { T: 0, F: 0 },
        'J/P': { J: 0, P: 0 }
    };
    
    try {
        answers.forEach((selectedIndex, questionIndex) => {
            if (questionIndex < questions.length) {
                const question = questions[questionIndex];
                const dim = question.dimension;
                
                if (dim && dimensions[dim]) {
                    let selectedPref;
                    
                    if (selectedIndex === 0 && question.agreePreference) {
                        selectedPref = question.agreePreference;
                    } else if (selectedIndex === 1 && question.disagreePreference) {
                        selectedPref = question.disagreePreference;
                    } else {
                        const preferences = dim === 'E/I' ? ['E', 'I'] :
                                          dim === 'S/N' ? ['S', 'N'] :
                                          dim === 'T/F' ? ['T', 'F'] : ['J', 'P'];
                        selectedPref = preferences[selectedIndex];
                    }
                    
                    if (selectedPref && dimensions[dim].hasOwnProperty(selectedPref)) {
                        dimensions[dim][selectedPref]++;
                    }
                }
            }
        });
        
        const type = 
            (dimensions['E/I'].E > dimensions['E/I'].I ? 'E' : 'I') +
            (dimensions['S/N'].S > dimensions['S/N'].N ? 'S' : 'N') +
            (dimensions['T/F'].T > dimensions['T/F'].F ? 'T' : 'F') +
            (dimensions['J/P'].J > dimensions['J/P'].P ? 'J' : 'P');
        
        return {
            type,
            scores: dimensions,
            timestamp: new Date()
        };
    } catch (error) {
        console.error('Error calculating MBTI result:', error);
        return {
            type: null,
            scores: dimensions,
            timestamp: new Date()
        };
    }
};

export const calculateHollandResult = (answers, questions) => {
    const scores = {
        R: 0, I: 0, A: 0, S: 0, E: 0, C: 0
    };
    const scoreCounts = {
        R: 0, I: 0, A: 0, S: 0, E: 0, C: 0
    };
    
    try {
        answers.forEach((selectedScore, questionIndex) => {
            if (questionIndex < questions.length) {
                const question = questions[questionIndex];
                const attribute = question.attribute;
                
                if (attribute && scores.hasOwnProperty(attribute)) {
                    scores[attribute] += selectedScore;
                    scoreCounts[attribute]++;
                }
            }
        });
        
        const averageScores = {};
        for (let attr in scores) {
            averageScores[attr] = scoreCounts[attr] > 0 ? 
                parseFloat((scores[attr] / scoreCounts[attr]).toFixed(2)) : 0;
        }
        
        return {
            scores: averageScores,
            timestamp: new Date()
        };
    } catch (error) {
        console.error('Error calculating Holland result:', error);
        return {
            scores: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
            timestamp: new Date()
        };
    }
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

export const validateQuestionData = (data, quizType) => {
    const errors = [];
    
    if (!data.content || data.content.trim() === '') {
        errors.push('Nội dung câu hỏi là bắt buộc');
    }
    
    if (quizType === 'MBTI') {
        if (!data.dimension || !['E/I', 'S/N', 'T/F', 'J/P'].includes(data.dimension)) {
            errors.push('MBTI phải gán một chiều hợp lệ: E/I, S/N, T/F, hoặc J/P');
        }
        
        if (data.agreePreference && !['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'].includes(data.agreePreference)) {
            errors.push('agreePreference không hợp lệ: phải là E, I, S, N, T, F, J, hoặc P');
        }
        if (data.disagreePreference && !['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'].includes(data.disagreePreference)) {
            errors.push('disagreePreference không hợp lệ: phải là E, I, S, N, T, F, J, hoặc P');
        }
    } 
    else if (quizType === 'Holland') {
        if (!data.attribute || !['R', 'I', 'A', 'S', 'E', 'C'].includes(data.attribute)) {
            errors.push('Holland phải gán một thuộc tính: R, I, A, S, E, hoặc C');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

export const getQuizStats = (quizId, attempts) => {
    const stats = {
        totalAttempts: attempts.length,
        resultDistribution: {},
        attemptsByDate: {}
    };
    
    if (attempts.length === 0) {
        return stats;
    }
    
    attempts.forEach(attempt => {
        if (attempt.interpretation) {
            const result = typeof attempt.interpretation === 'string' ? 
                attempt.interpretation : JSON.stringify(attempt.interpretation);
            stats.resultDistribution[result] = 
                (stats.resultDistribution[result] || 0) + 1;
        }
        
        const date = new Date(attempt.attemptedAt).toISOString().split('T')[0];
        stats.attemptsByDate[date] = (stats.attemptsByDate[date] || 0) + 1;
    });
    
    return stats;
};

export const generateOptions = (quizType, dimension = null, attribute = null, agreePreference = null, disagreePreference = null) => {
    if (quizType === 'MBTI') {
        return [
            {
                text: 'Đồng ý',
                preference: agreePreference || (dimension === 'E/I' ? 'E' : 
                           dimension === 'S/N' ? 'S' : 
                           dimension === 'T/F' ? 'T' : 'J')
            },
            {
                text: 'Không đồng ý',
                preference: disagreePreference || (dimension === 'E/I' ? 'I' : 
                           dimension === 'S/N' ? 'N' : 
                           dimension === 'T/F' ? 'F' : 'P')
            }
        ];
    } else if (quizType === 'Holland') {
        return [
            { text: 'Rất không thích', score: 1 },
            { text: 'Không thích', score: 2 },
            { text: 'Bình thường', score: 3 },
            { text: 'Thích', score: 4 },
            { text: 'Rất thích', score: 5 }
        ];
    }
    return [];
};

export default {
    isValidObjectId,
    calculateMBTIResult,
    calculateHollandResult,
    validatePersonalityQuizData,
    validateQuestionData,
    getQuizStats,
    generateOptions
};
