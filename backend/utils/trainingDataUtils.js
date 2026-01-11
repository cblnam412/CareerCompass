import TrainingData from '../models/TrainingData.js';
import Subject from '../models/Subject.js';

export const convertAcademicTranscriptToScores = async (academicTranscript) => {
    if (!academicTranscript || !Array.isArray(academicTranscript)) {
        return {};
    }

    const subjectScores = {};
    
    for (const item of academicTranscript) {
        if (item.subjectId) {
            const subjectId = typeof item.subjectId === 'string' ? item.subjectId : item.subjectId._id;
            const subject = await Subject.findById(subjectId).select('name');
            
            if (subject) {
                const normalizedName = subject.name.toLowerCase().replace(/\s+/g, '');
                subjectScores[normalizedName] = item.score || 5;
            }
        }
    }
    
    return subjectScores;
};

export const calculateCompletenessScore = (data) => {
    const importantFields = [
        { field: 'mbtiType', weight: 1.5 },
        { field: 'hollandCode', weight: 2 },
        { field: 'subjectScores', weight: 2 },
        { field: 'gpa', weight: 1.5 },
        { field: 'softSkills', weight: 1 },
        { field: 'recommendedMajors', weight: 2 },
    ];
    
    let totalWeight = 0;
    let filledWeight = 0;
    
    importantFields.forEach(({ field, weight }) => {
        totalWeight += weight;
        
        if (field === 'hollandCode' && data.hollandCode) {
            const codes = Object.values(data.hollandCode).filter(v => v !== undefined && v !== null).length;
            if (codes >= 4) filledWeight += weight;
            else if (codes >= 2) filledWeight += weight * 0.5;
        } else if (field === 'subjectScores' && data.subjectScores) {
            const scores = Object.values(data.subjectScores).filter(v => v !== undefined && v !== null).length;
            if (scores >= 5) filledWeight += weight;
            else if (scores >= 3) filledWeight += weight * 0.6;
        } else if (field === 'softSkills' && data.softSkills) {
            const skills = Object.values(data.softSkills).filter(v => v !== undefined && v !== null).length;
            if (skills >= 4) filledWeight += weight;
            else if (skills >= 2) filledWeight += weight * 0.5;
        } else if (field === 'recommendedMajors' && data.recommendedMajors && data.recommendedMajors.length > 0) {
            filledWeight += weight;
        } else if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
            filledWeight += weight;
        }
    });
    
    return Math.round((filledWeight / totalWeight) * 100);
};

export const validateTrainingData = (data) => {
    const errors = [];
    
    if (!data.studentId && !data.externalDataId) {
        errors.push('Either studentId or externalDataId is required');
    }
    
    if (!data.recommendedMajors || data.recommendedMajors.length === 0) {
        errors.push('At least one recommended major is required');
    }
    
    if (data.subjectScores) {
        Object.entries(data.subjectScores).forEach(([subject, score]) => {
            if (score !== undefined && score !== null && (score < 0 || score > 10)) {
                errors.push(`subjectScores.${subject} must be between 0 and 10`);
            }
        });
    }

    if (data.gpa && (data.gpa < 0 || data.gpa > 10)) {
        errors.push('GPA must be between 0 and 10');
    }
    
    if (data.hollandCode) {
        Object.entries(data.hollandCode).forEach(([code, score]) => {
            if (score !== undefined && score !== null && (score < 0 || score > 100)) {
                errors.push(`hollandCode.${code} must be between 0 and 100`);
            }
        });
    }
    
    if (data.softSkills) {
        Object.entries(data.softSkills).forEach(([skill, score]) => {
            if (score !== undefined && score !== null && (score < 0 || score > 10)) {
                errors.push(`softSkills.${skill} must be between 0 and 10`);
            }
        });
    }
    
    const validMBTI = ['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 
                       'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'];
    if (data.mbtiType && !validMBTI.includes(data.mbtiType)) {
        errors.push(`Invalid MBTI type: ${data.mbtiType}`);
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

export const extractFeatures = (data) => {
    const features = {};
    
    // Subject scores - use average if available, default to 5
    const subjectScores = data.subjectScores || {};
    
    // Normalize subject names and extract scores
    const normalizeSubjectName = (name) => name.toLowerCase().replace(/\s+/g, '');
    
    // Định nghĩa các môn học phổ biến
    const subjectMapping = {
        'toán': ['math', 'toan', 'toán'],
        'vật lý': ['physics', 'vatlý', 'vật lý', 'vl'],
        'hóa học': ['chemistry', 'hoahoc', 'hóa học', 'hh'],
        'sinh học': ['biology', 'sinhhoc', 'sinh học', 'sh'],
        'ngữ văn': ['literature', 'nguvvan', 'ngữ văn', 'nv'],
        'lịch sử': ['history', 'lichsu', 'lịch sử', 'ls'],
        'địa lý': ['geography', 'dialy', 'địa lý', 'dl'],
        'công dân': ['civic', 'congdan', 'công dân', 'cd'],
        'tiếng anh': ['english', 'english', 'tiếng anh', 'ta']
    };
    
    // Tìm điểm cho từng môn
    const getScoreForSubject = (targetName) => {
        for (const [key, value] of Object.entries(subjectScores)) {
            const normalizedKey = normalizeSubjectName(key);
            if (normalizeSubjectName(targetName).includes(normalizedKey) || 
                normalizedKey.includes(normalizeSubjectName(targetName))) {
                return (value ?? 5) / 10;
            }
        }
        return 5 / 10; // Default
    };
    
    // Extract subject scores with better weighting
    features.math = getScoreForSubject('toán');
    features.physics = getScoreForSubject('vật lý');
    features.chemistry = getScoreForSubject('hóa học');
    features.biology = getScoreForSubject('sinh học');
    features.literature = getScoreForSubject('ngữ văn');
    features.history = getScoreForSubject('lịch sử');
    features.geography = getScoreForSubject('địa lý');
    features.civic = getScoreForSubject('công dân');
    features.english = getScoreForSubject('tiếng anh');
    
    if (data.gpa) {
        features.gpa = (data.gpa) / 10;
    } else {
        const subjectValues = Object.values(subjectScores).filter(v => v !== undefined && v !== null);
        if (subjectValues.length > 0) {
            const avgScore = subjectValues.reduce((a, b) => a + b, 0) / subjectValues.length;
            features.gpa = (avgScore) / 10;
        } else {
            features.gpa = 0.5;
        }
    }
    
    features.realistic = (data.hollandCode?.R ?? data.hollandCode?.realistic ?? 50) / 100;
    features.investigative = (data.hollandCode?.I ?? data.hollandCode?.investigative ?? 50) / 100;
    features.artistic = (data.hollandCode?.A ?? data.hollandCode?.artistic ?? 50) / 100;
    features.social = (data.hollandCode?.S ?? data.hollandCode?.social ?? 50) / 100;
    features.enterprising = (data.hollandCode?.E ?? data.hollandCode?.enterprising ?? 50) / 100;
    features.conventional = (data.hollandCode?.C ?? data.hollandCode?.conventional ?? 50) / 100;
    
    // Soft skills with default values
    const softSkills = data.softSkills || {};
    features.communication = (softSkills.communication ?? 5) / 10;
    features.problemSolving = (softSkills.problemSolving ?? 5) / 10;
    features.teamwork = (softSkills.teamwork ?? 5) / 10;
    features.leadership = (softSkills.leadership ?? 5) / 10;
    features.creativity = (softSkills.creativity ?? 5) / 10;
    features.timeManagement = (softSkills.timeManagement ?? 5) / 10;

    features.scienceStrength = (
        features.physics * 0.4 + 
        features.chemistry * 0.3 + 
        features.biology * 0.2 + 
        features.math * 0.5
    ) / 1.4;
    
    features.humanitiesStrength = (
        features.literature * 0.4 + 
        features.history * 0.3 + 
        features.geography * 0.2 + 
        features.civic * 0.1
    ) / 1.0;
    
    features.academicAverage = (
        features.math + features.physics + features.chemistry + 
        features.biology + features.literature + features.english
    ) / 6;
    
    features.softSkillsAverage = (
        features.communication + features.problemSolving + 
        features.teamwork + features.leadership + 
        features.creativity + features.timeManagement
    ) / 6;
    
    features.technicalAptitude = (features.math * 0.6 + features.physics * 0.4);
    features.businessPotential = (features.communication * 0.4 + features.leadership * 0.3 + features.enterprising * 0.3);
    features.creativePotential = (features.creativity * 0.5 + features.artistic * 0.5);
    features.researchAptitude = (features.problemSolving * 0.4 + features.investigative * 0.6);
    features.overallCompetence = (features.academicAverage * 0.6 + features.softSkillsAverage * 0.4);
    
    const mbtiTypes = ['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP',
                      'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'];
    mbtiTypes.forEach(type => {
        features[`mbti_${type}`] = data.mbtiType === type ? 1 : 0;
    });
    
    return features;
};

export const getFeatureNames = () => {
    const features = [
        'math', 'physics', 'chemistry', 'biology', 'literature', 'history', 
        'geography', 'civic', 'english', 'gpa',
        'realistic', 'investigative', 'artistic', 'social', 'enterprising', 'conventional',
        'communication', 'problemSolving', 'teamwork', 'leadership', 'creativity', 'timeManagement',
        // Composite features for enhanced weighting
        'scienceStrength', 'humanitiesStrength', 'academicAverage', 'softSkillsAverage',
        'technicalAptitude', 'businessPotential', 'creativePotential', 'researchAptitude', 'overallCompetence'
    ];
    
    const mbtiTypes = ['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP',
                      'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'];
    mbtiTypes.forEach(type => features.push(`mbti_${type}`));
    
    return features;
};

export const featuresToArray = (features, featureNames) => {
    return featureNames.map(name => features[name] ?? 0);
};

export const prepareTrainingDataset = async (filter = {}) => {
    try {
        const query = {
            isValid: true,
            usedForTraining: false,
            completenessScore: { $gte: 50 },
            ...filter
        };
        
        const trainingData = await TrainingData.find(query)
            .populate('recommendedMajors.majorId', 'name category')
            .lean();
        
        if (trainingData.length === 0) {
            return {
                success: false,
                error: 'No valid training data available'
            };
        }
        
        const featureNames = getFeatureNames();
        const dataset = {
            X: [], 
            y: [], 
            features: [], 
            studentIds: [],
            majorIds: [],
            rawData: []
        };
        
        trainingData.forEach(data => {
            const features = extractFeatures(data);
            const featureArray = featuresToArray(features, featureNames);
            
            dataset.X.push(featureArray);
            dataset.features.push(features);
            
            if (data.recommendedMajors && data.recommendedMajors.length > 0) {
                const primaryMajor = data.recommendedMajors.reduce((prev, current) => 
                    (prev.matchScore > current.matchScore) ? prev : current
                );
                const majorId = primaryMajor.majorId?._id || primaryMajor.majorId;
                dataset.y.push(majorId.toString());
                dataset.majorIds.push(majorId);
            }
            
            dataset.studentIds.push(data.studentId);
            dataset.rawData.push(data);
        });
        
        return {
            success: true,
            dataset,
            samplesCount: trainingData.length,
            featureNames,
            featureCount: featureNames.length
        };
    } catch (error) {
        console.error('Error preparing training dataset:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export const trainTestSplit = (dataset, testSize = 0.2, randomState = 42) => {
    const n = dataset.X.length;
    const testCount = Math.floor(n * testSize);
    const trainCount = n - testCount;
    
    let indices = Array.from({length: n}, (_, i) => i);
    
    const seededRandom = (seed) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };
    
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(randomState + i) * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    const trainIndices = indices.slice(0, trainCount);
    const testIndices = indices.slice(trainCount);
    
    return {
        train: {
            X: trainIndices.map(i => dataset.X[i]),
            y: trainIndices.map(i => dataset.y[i]),
            features: trainIndices.map(i => dataset.features[i]),
            studentIds: trainIndices.map(i => dataset.studentIds[i]),
            rawData: trainIndices.map(i => dataset.rawData[i])
        },
        test: {
            X: testIndices.map(i => dataset.X[i]),
            y: testIndices.map(i => dataset.y[i]),
            features: testIndices.map(i => dataset.features[i]),
            studentIds: testIndices.map(i => dataset.studentIds[i]),
            rawData: testIndices.map(i => dataset.rawData[i])
        }
    };
};

export const markDataAsUsedForTraining = async (dataIds) => {
    try {
        const result = await TrainingData.updateMany(
            { _id: { $in: dataIds } },
            { usedForTraining: true, updatedAt: new Date() }
        );
        return { 
            success: true, 
            modifiedCount: result.modifiedCount 
        };
    } catch (error) {
        console.error('Error marking data as used for training:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
};

export const createTrainingDataFromStudentData = async (studentId, StudentProfile, QuizAttempt, ExamResult, Major) => {
    try {
        const profile = await StudentProfile.findOne({ userId: studentId });
        
        if (!profile) {
            return { success: false, error: 'Student profile not found' };
        }
        
        const quizAttempt = await QuizAttempt.findOne({ studentId })
            .sort({ createdAt: -1 })
            .populate('quizId');
        
        const examResult = await ExamResult.findOne({ studentId })
            .sort({ takenAt: -1 });
        
        const trainingData = {
            studentId,
            
            mbtiType: profile.mbtiResult?.type,
            hollandCode: profile.hollandResult?.scores || {},
            subjectScores: examResult?.scoreDetails || {},
            gpa: profile.gpa,
            softSkills: profile.softSkillsAssessment || {},
            interests: profile.interests || [],
            learningStyle: profile.learningStyle,
            recommendedMajors: [],
            dataSource: 'combined',
            completenessScore: 0,
            isValid: false,
            usedForTraining: false,
        };
        trainingData.completenessScore = calculateCompletenessScore(trainingData);
        const validation = validateTrainingData(trainingData);
        trainingData.isValid = validation.isValid;
        trainingData.validationErrors = validation.errors;
        
        return {
            success: true,
            trainingData
        };
    } catch (error) {
        console.error('Error creating training data:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
};
