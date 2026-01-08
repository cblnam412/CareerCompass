import MajorRecommendation from '../models/MajorRecommendation.js';
import TrainingData from '../models/TrainingData.js';
import ModelVersion from '../models/ModelVersion.js';
import StudentProfile from '../models/StudentProfile.js';
import Major from '../models/Major.js';
import User from '../models/User.js';
import { 
    extractFeatures, 
    featuresToArray, 
    getFeatureNames,
    calculateCompletenessScore,
    validateTrainingData
} from '../utils/trainingDataUtils.js';
import { MajorRecommendationModel } from '../utils/mlModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODELS_DIR = path.join(__dirname, '../models_ml');

let loadedModel = null;
let modelVersion = null;

const loadModel = async () => {
    try {
        if (loadedModel && modelVersion) {
            return loadedModel;
        }
        
        const activeModel = await ModelVersion.findOne({ isActive: true }).sort({ version: -1 });
        
        if (!activeModel) {
            return null;
        }
        
        if (!fs.existsSync(activeModel.modelPath)) {
            console.error(`Model file not found: ${activeModel.modelPath}`);
            return null;
        }
        
        const modelJSON = JSON.parse(fs.readFileSync(activeModel.modelPath, 'utf-8'));
        loadedModel = MajorRecommendationModel.fromJSON(modelJSON);
        modelVersion = activeModel;
        
        return loadedModel;
    } catch (error) {
        console.error('Error loading model:', error);
        return null;
    }
};

const mbtiDescriptions = {
    'ISTJ': {
        name: 'The Logistician',
        vietnameseName: 'Nhà Lôgic',
        description: 'Thực tiễn, trách nhiệm, có tổ chức. Thích công việc có cấu trúc rõ ràng.',
        strengths: ['Trách nhiệm', 'Tổ chức', 'Tin tưởng được', 'Chi tiết'],
        careers: ['Kỹ sư', 'Quản lý dự án', 'Kế toán', 'Giáo viên']
    },
    'ISFJ': {
        name: 'The Defender',
        vietnameseName: 'Người Bảo Vệ',
        description: 'Nhạy cảm, trách nhiệm, thích giúp đỡ người khác. Hướng vào dịch vụ.',
        strengths: ['Tận tâm', 'Trung thực', 'Khả năng nghe', 'Chăm sóc'],
        careers: ['Nhân viên y tế', 'Tư vấn viên', 'Giáo viên', 'Công tác xã hội']
    },
    'INFJ': {
        name: 'The Advocate',
        vietnameseName: 'Nhà Ủng Hộ',
        description: 'Sáng tạo, nhạy cảm, muốn tạo ảnh hưởng tích cực. Có tầm nhìn dài hạn.',
        strengths: ['Trực giác', 'Sáng tạo', 'Quyết tâm', 'Thấu hiểu'],
        careers: ['Tư vấn viên', 'Nhà văn', 'Nhà thiết kế', 'Nhà tâm lý học']
    },
    'INTJ': {
        name: 'The Commander',
        vietnameseName: 'Nhà Chỉ Huy',
        description: 'Logic, độc lập, có tham vọng. Thích giải quyết vấn đề phức tạp.',
        strengths: ['Chiến lược', 'Độc lập', 'Phân tích', 'Quyết đoán'],
        careers: ['Kỹ sư', 'Nhà khoa học', 'Giáo sư đại học', 'Doanh nhân']
    },
    'ISTP': {
        name: 'The Virtuoso',
        vietnameseName: 'Người Tài Ba',
        description: 'Thực tế, logic, thích làm việc với tay. Tò mò về cách mọi thứ hoạt động.',
        strengths: ['Động tác khéo léo', 'Phân tích', 'Độc lập', 'Tỉnh táo'],
        careers: ['Thợ cơ khí', 'Lập trình viên', 'Kỹ sư', 'Phi công']
    },
    'ISFP': {
        name: 'The Adventurer',
        vietnameseName: 'Người Mạo Hiểm',
        description: 'Nhạy cảm, nhuận phục, yêu thích sự tự do. Sáng tạo và thực tế.',
        strengths: ['Sáng tạo', 'Tâm lý nhạy', 'Tính thẩm mỹ', 'Hòa nhập'],
        careers: ['Nghệ sĩ', 'Nhạc sĩ', 'Thợ thủ công', 'Nha sĩ']
    },
    'INFP': {
        name: 'The Mediator',
        vietnameseName: 'Người Hòa Giải',
        description: 'Lý tưởng, nhạy cảm, sáng tạo. Muốn tìm ý nghĩa và mục đích.',
        strengths: ['Sáng tạo', 'Đội hợp tác', 'Cảm thông', 'Lý tưởng'],
        careers: ['Nhà văn', 'Tuyên truyền viên', 'Tâm lý học', 'Nhà giáo dục']
    },
    'INTP': {
        name: 'The Logician',
        vietnameseName: 'Nhà Logic',
        description: 'Tò mò, độc lập, thích khám phá ý tưởng. Giỏi lý thuyết.',
        strengths: ['Phân tích', 'Sáng tạo', 'Tò mò', 'Logic'],
        careers: ['Nhà khoa học', 'Lập trình viên', 'Giáo sư', 'Nhà phân tích dữ liệu']
    },
    'ESTP': {
        name: 'The Entrepreneur',
        vietnameseName: 'Nhà Kinh Doanh',
        description: 'Năng động, thực tế, thích hành động. Tìm tòi và mạo hiểm.',
        strengths: ['Thích ứng', 'Năng động', 'Tỉnh táo', 'Quyết đoán'],
        careers: ['Bán hàng', 'Tiếp thị', 'Kinh doanh', 'Huấn luyện viên']
    },
    'ESFP': {
        name: 'The Entertainer',
        vietnameseName: 'Người Biểu Diễn',
        description: 'Vui vẻ, xã hội, thích gây chú ý. Sống trong hiện tại.',
        strengths: ['Sôi nổi', 'Giao tiếp', 'Linh hoạt', 'Hấp dẫn'],
        careers: ['Ca sĩ', 'Diễn viên', 'Huấn luyện viên', 'Nhân viên tiếp khách']
    },
    'ENFP': {
        name: 'The Campaigner',
        vietnameseName: 'Nhà Vận Động',
        description: 'Sáng tạo, xã hội, lạc quan. Yêu thích sự đa dạng và khám phá.',
        strengths: ['Năng lượng', 'Sáng tạo', 'Giao tiếp', 'Tò mò'],
        careers: ['Nhà tiếp thị', 'Nhà tư vấn', 'Huấn luyện viên', 'Nhà giáo dục']
    },
    'ENTP': {
        name: 'The Debater',
        vietnameseName: 'Nhà Tranh Luận',
        description: 'Logic, sáng tạo, thích tranh luận. Luôn tìm kiếm thách thức mới.',
        strengths: ['Phân tích', 'Sáng tạo', 'Logic', 'Thích ứng'],
        careers: ['Nhà khoa học', 'Luật sư', 'Phóng viên', 'Doanh nhân']
    },
    'ESTJ': {
        name: 'The Executive',
        vietnameseName: 'Nhà Quản Lý',
        description: 'Trách nhiệm, tổ chức, lãnh đạo. Thích cấu trúc và kỷ luật.',
        strengths: ['Lãnh đạo', 'Tổ chức', 'Trách nhiệm', 'Hiệu quả'],
        careers: ['Quản lý', 'Chỉ huy quân sự', 'Cảnh sát', 'Giáo viên']
    },
    'ESFJ': {
        name: 'The Consul',
        vietnameseName: 'Nhà Tư Vấn',
        description: 'Xã hội, trách nhiệm, chăm sóc. Muốn giúp đỡ và phục vụ.',
        strengths: ['Giao tiếp', 'Chăm sóc', 'Tổ chức', 'Hợp tác'],
        careers: ['Nhân viên y tế', 'Giáo viên', 'Công tác xã hội', 'Nhân viên bán hàng']
    },
    'ENFJ': {
        name: 'The Protagonist',
        vietnameseName: 'Nhân Vật Chính',
        description: 'Lãnh đạo, sáng tạo, xã hội. Truyền cảm hứng cho người khác.',
        strengths: ['Lãnh đạo', 'Giao tiếp', 'Thấu hiểu', 'Sáng tạo'],
        careers: ['Nhà lãnh đạo', 'Giáo viên', 'Tâm lý học', 'Tuyên truyền viên']
    },
    'ENTJ': {
        name: 'The Commander',
        vietnameseName: 'Nhà Chỉ Huy Tổ Chức',
        description: 'Lãnh đạo, logic, tham vọng. Lao động vì mục tiêu lớn.',
        strengths: ['Lãnh đạo', 'Chiến lược', 'Quyết đoán', 'Tổ chức'],
        careers: ['Giám đốc điều hành', 'Giám đốc', 'Luật sư', 'Doanh nhân']
    }
};

/**
 * Mô tả Holland Code
 */
const hollandDescriptions = {
    realistic: {
        name: 'Thực hành',
        description: 'Giỏi làm việc với tay, thích công việc thực tế. Thích xây dựng, sửa chữa.',
        majorTypes: ['Kỹ thuật', 'Cơ khí', 'Xây dựng', 'Nông lâm']
    },
    investigative: {
        name: 'Nghiên cứu',
        description: 'Yêu thích khoa học, phân tích, giải quyết vấn đề. Tò mò về cách thế giới hoạt động.',
        majorTypes: ['Khoa học', 'Công nghệ', 'Toán học', 'Phi lý']
    },
    artistic: {
        name: 'Sáng tạo',
        description: 'Có khả năng sáng tạo, thích biểu hiện cảm xúc. Thích hoạt động tự do.',
        majorTypes: ['Mỹ thuật', 'âm nhạc', 'Thiết kế', 'Văn học']
    },
    social: {
        name: 'Xã hội',
        description: 'Yêu thích giúp đỡ người khác, tốt tính, empathy cao. Muốn tạo tác động tích cực.',
        majorTypes: ['Giáo dục', 'Y tế', 'Công tác xã hội', 'Tâm lý học']
    },
    enterprising: {
        name: 'Kinh doanh',
        description: 'Thích lãnh đạo, thuyết phục, kinh doanh. Có tham vọng và năng lượng.',
        majorTypes: ['Quản lý', 'Bán hàng', 'Tiếp thị', 'Doanh nhân']
    },
    conventional: {
        name: 'Hành chính',
        description: 'Giỏi tổ chức, chi tiết, quy trình. Thích công việc có cấu trúc rõ ràng.',
        majorTypes: ['Kế toán', 'Hành chính', 'Thư ký', 'Thống kê']
    }
};

export const getMajorRecommendation = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const model = await loadModel();
        if (!model) {
            return res.status(503).json({
                success: false,
                message: 'Mô hình khuyến nghị chưa sẵn sàng. Vui lòng thực hiện training.'
            });
        }
        
        const studentProfile = await StudentProfile.findOne({ userId: studentId });
        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hồ sơ học sinh'
            });
        }
        
        const features = extractFeatures({
            mbtiType: studentProfile.mbtiResult?.type,
            hollandCode: studentProfile.hollandResult?.scores,
            subjectScores: studentProfile.academicTranscript,
            gpa: studentProfile.gpa,
            softSkills: {} 
        });
        
        const featureNames = getFeatureNames();
        const featureArray = featuresToArray(features, featureNames);
        
        const topKPredictions = model.predictTopK(featureArray, 3);
        
        const majors = await Major.find({ _id: { $in: topKPredictions.map(p => p.majorId) } });
        const majorMap = {};
        majors.forEach(m => {
            majorMap[m._id.toString()] = m;
        });
        
        const mbtiType = studentProfile.mbtiResult?.type || 'INTJ';
        const mbtiDesc = mbtiDescriptions[mbtiType] || mbtiDescriptions['INTJ'];
        
        const hollandScores = studentProfile.hollandResult?.scores || {};
        const topHollandCodes = Object.entries(hollandScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([code, score]) => ({
                code,
                score,
                description: hollandDescriptions[code]
            }));
        
        const recommendations = topKPredictions.map(pred => {
            const major = majorMap[pred.majorId];
            
            let reason = [];
            
            if (mbtiDesc.careers.some(c => major.name.includes(c))) {
                reason.push(`Phù hợp với loại hình công việc cho ${mbtiDesc.vietnameseName}`);
            }
            
            topHollandCodes.forEach(({code, description}) => {
                if (description.majorTypes.some(t => major.category.includes(t))) {
                    reason.push(`Phù hợp với hướng ${description.name}`);
                }
            });
            
            return {
                majorId: major._id,
                name: major.name,
                category: major.category,
                matchScore: pred.probability,
                reason: reason.length > 0 ? reason[0] : 'Dựa trên phân tích dữ liệu học sinh'
            };
        });
        
        const majorRecommendation = await MajorRecommendation.findOneAndUpdate(
            { studentId },
            {
                studentId,
                modelId: modelVersion._id,
                suggestions: recommendations.map(r => r.majorId),
                imputDataSnapshot: {
                    mbtiType,
                    hollandCode: hollandScores,
                    subjectScores: studentProfile.academicTranscript,
                    gpa: studentProfile.gpa
                }
            },
            { upsert: true, new: true }
        ).populate('suggestions', 'name category');
        
        return res.status(200).json({
            success: true,
            data: {
                studentId,
                personalityProfile: {
                    mbtiType,
                    mbtiName: mbtiDesc.vietnameseName,
                    mbtiDescription: mbtiDesc.description,
                    mbtiStrengths: mbtiDesc.strengths,
                    mbtiCareers: mbtiDesc.careers
                },
                hollandProfile: topHollandCodes,
                recommendations,
                modelVersion: modelVersion.version,
                confidenceScore: (recommendations[0]?.matchScore || 0).toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error getting major recommendation:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy khuyến nghị ngành',
            error: error.message
        });
    }
};

export const createTrainingData = async (req, res) => {
    try {
        const { 
            studentId,                
            externalDataId,        
            dataSourceName,             
            recommendedMajors,
            mbtiType,
            mbtiScores,
            hollandCode,
            subjectScores,
            gpa,
            softSkills
        } = req.body;
        
        if (!studentId && !externalDataId) {
            return res.status(400).json({
                success: false,
                message: 'Either studentId or externalDataId is required'
            });
        }
        
        if (!recommendedMajors || recommendedMajors.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'recommendedMajors là bắt buộc'
            });
        }
        
        let trainingData;
        
        // Trường hợp 1: Dữ liệu từ học sinh nội bộ
        if (studentId) {
            const studentProfile = await StudentProfile.findOne({ userId: studentId });
            if (!studentProfile) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy hồ sơ học sinh'
                });
            }
            
            trainingData = new TrainingData({
                studentId,
                dataSourceType: 'internal_student',
                mbtiType: studentProfile.mbtiResult?.type,
                hollandCode: studentProfile.hollandResult?.scores,
                subjectScores: studentProfile.academicTranscript,
                gpa: studentProfile.gpa,
                softSkills: {},
                interests: studentProfile.interests || [],
                learningStyle: studentProfile.learningStyle,
                recommendedMajors: recommendedMajors.map(({ majorId, matchScore, reason }) => ({
                    majorId,
                    matchScore,
                    reason,
                    isPrimary: recommendedMajors.indexOf(majorId) === 0
                })),
                isValid: true
            });
        } 
        // Trường hợp 2: Dữ liệu từ open source hoặc bên ngoài
        else {
            trainingData = new TrainingData({
                externalDataId,
                dataSourceType: 'external_open_source',
                dataSourceName: dataSourceName || 'Unknown Source',
                mbtiType,
                mbtiScores,
                hollandCode: hollandCode || {},
                subjectScores: subjectScores || {},
                gpa,
                softSkills: softSkills || {},
                recommendedMajors: recommendedMajors.map(({ majorId, matchScore, reason }) => ({
                    majorId,
                    matchScore,
                    reason,
                    isPrimary: recommendedMajors.indexOf(majorId) === 0
                })),
                isValid: true
            });
        }
        
        const validation = validateTrainingData(trainingData);
        if (!validation.isValid) {
            trainingData.isValid = false;
            trainingData.validationErrors = validation.errors;
        }
        
        trainingData.completenessScore = calculateCompletenessScore(trainingData);
        
        await trainingData.save();
        
        return res.status(201).json({
            success: true,
            message: 'Training data đã được tạo',
            data: {
                trainingDataId: trainingData._id,
                completenessScore: trainingData.completenessScore,
                isValid: trainingData.isValid,
                errors: trainingData.validationErrors
            }
        });
    } catch (error) {
        console.error('Error creating training data:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo training data',
            error: error.message
        });
    }
};

export const getModelStats = async (req, res) => {
    try {
        const activeModel = await ModelVersion.findOne({ isActive: true }).sort({ version: -1 });
        
        if (!activeModel) {
            return res.status(404).json({
                success: false,
                message: 'Model chưa được training'
            });
        }
        
        const trainingDataCount = await TrainingData.countDocuments({ usedForTraining: true });
        const recommendationCount = await MajorRecommendation.countDocuments();
        
        return res.status(200).json({
            success: true,
            data: {
                version: activeModel.version,
                modelType: activeModel.modelType,
                trainingDate: activeModel.trainingDate,
                performanceMetrics: activeModel.performanceMetrics,
                trainingDataUsed: trainingDataCount,
                totalRecommendations: recommendationCount,
                featureImportance: activeModel.featureImportance,
                notes: activeModel.notes,
                hyperparameters: activeModel.trainingConfig.hyperparameters
            }
        });
    } catch (error) {
        console.error('Error getting model stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê model',
            error: error.message
        });
    }
};


export const getTrainingDataList = async (req, res) => {
    try {
        const { usedForTraining = false, limit = 10, skip = 0 } = req.query;
        
        const query = {};
        if (usedForTraining === 'true') {
            query.usedForTraining = true;
        } else if (usedForTraining === 'false') {
            query.usedForTraining = false;
        }
        
        const total = await TrainingData.countDocuments(query);
        const data = await TrainingData.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .select('studentId completenessScore isValid usedForTraining createdAt');
        
        return res.status(200).json({
            success: true,
            data,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error getting training data list:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách training data',
            error: error.message
        });
    }
};

export const importExternalTrainingData = async (req, res) => {
    try {
        const { dataSourceName, trainingRecords } = req.body;
        
        if (!dataSourceName || !trainingRecords || !Array.isArray(trainingRecords)) {
            return res.status(400).json({
                success: false,
                message: 'dataSourceName và trainingRecords (array) là bắt buộc'
            });
        }
        
        if (trainingRecords.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'trainingRecords không được rỗng'
            });
        }
        
        const results = {
            success: 0,
            failed: 0,
            errors: [],
            ids: []
        };
        
        for (let i = 0; i < trainingRecords.length; i++) {
            const record = trainingRecords[i];
            
            try {
                const externalDataId = `${dataSourceName}_${Date.now()}_${i}`;
                
                const trainingData = new TrainingData({
                    externalDataId,
                    dataSourceType: 'external_open_source',
                    dataSourceName,
                    mbtiType: record.mbtiType,
                    mbtiScores: record.mbtiScores,
                    hollandCode: record.hollandCode || {},
                    subjectScores: record.subjectScores || {},
                    gpa: record.gpa,
                    softSkills: record.softSkills || {},
                    interests: record.interests || [],
                    learningStyle: record.learningStyle,
                    recommendedMajors: Array.isArray(record.recommendedMajors) 
                        ? record.recommendedMajors 
                        : [{
                            majorId: record.majorId,
                            matchScore: record.matchScore || 50,
                            reason: record.reason || 'Imported from external source'
                          }],
                    isValid: true
                });
                
                const validation = validateTrainingData(trainingData);
                if (!validation.isValid) {
                    trainingData.isValid = false;
                    trainingData.validationErrors = validation.errors;
                }
                
                trainingData.completenessScore = calculateCompletenessScore(trainingData);
                
                await trainingData.save();
                results.success++;
                results.ids.push(trainingData._id);
            } catch (error) {
                results.failed++;
                results.errors.push({
                    index: i,
                    error: error.message
                });
            }
        }
        
        return res.status(201).json({
            success: true,
            message: `Imported ${results.success}/${trainingRecords.length} records`,
            data: {
                successCount: results.success,
                failedCount: results.failed,
                totalImported: results.success,
                trainingDataIds: results.ids,
                errors: results.errors.length > 0 ? results.errors : undefined
            }
        });
    } catch (error) {
        console.error('Error importing external training data:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi import dữ liệu training',
            error: error.message
        });
    }
};

export const getTrainingDataStats = async (req, res) => {
    try {
        const stats = {
            total: 0,
            bySource: {},
            byValidity: { valid: 0, invalid: 0 },
            byUsage: { used: 0, unused: 0 },
            completeness: { high: 0, medium: 0, low: 0 }
        };
        
        stats.total = await TrainingData.countDocuments();
        
        const sourceStats = await TrainingData.aggregate([
            {
                $group: {
                    _id: '$dataSourceType',
                    count: { $sum: 1 },
                    avgCompleteness: { $avg: '$completenessScore' }
                }
            }
        ]);
        
        sourceStats.forEach(stat => {
            stats.bySource[stat._id || 'unknown'] = {
                count: stat.count,
                avgCompleteness: Math.round(stat.avgCompleteness || 0)
            };
        });
        
        stats.byValidity.valid = await TrainingData.countDocuments({ isValid: true });
        stats.byValidity.invalid = await TrainingData.countDocuments({ isValid: false });
        
        stats.byUsage.used = await TrainingData.countDocuments({ usedForTraining: true });
        stats.byUsage.unused = await TrainingData.countDocuments({ usedForTraining: false });
        
        stats.completeness.high = await TrainingData.countDocuments({ completenessScore: { $gte: 80 } });
        stats.completeness.medium = await TrainingData.countDocuments({ 
            completenessScore: { $gte: 50, $lt: 80 } 
        });
        stats.completeness.low = await TrainingData.countDocuments({ completenessScore: { $lt: 50 } });
        
        return res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting training data stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê training data',
            error: error.message
        });
    }
};
