import MajorRecommendation from '../models/MajorRecommendation.js';
import TrainingData from '../models/TrainingData.js';
import ModelVersion from '../models/ModelVersion.js';
import StudentProfile from '../models/StudentProfile.js';
import Major from '../models/Major.js';
import User from '../models/User.js';
import MajorMapping from '../models/MajorMapping.js';
import Subject from '../models/Subject.js';
import SoftSkill from '../models/SoftSkill.js';
import RecommendationFeedBack from '../models/RecommendationFeedBack.js';
import { 
    extractFeatures, 
    featuresToArray, 
    getFeatureNames,
    calculateCompletenessScore,
    validateTrainingData,
    convertAcademicTranscriptToScores
} from '../utils/trainingDataUtils.js';
import { MajorRecommendationModel } from '../utils/mlModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const groqApiKey = process.env.GROQ_API_KEY;

const rateLimiter = {
    requestTimestamps: [],
    maxRequests: 20,
    timeWindow: 60000, 
    minInterval: 3000, 
    
    async waitForSlot() {
        const now = Date.now();
        
        this.requestTimestamps = this.requestTimestamps.filter(
            timestamp => now - timestamp < this.timeWindow
        );
        
        if (this.requestTimestamps.length >= this.maxRequests) {
            const oldestRequest = this.requestTimestamps[0];
            const waitTime = this.timeWindow - (now - oldestRequest);
            
            if (waitTime > 0) {
                console.log(`[RateLimit] Reached limit. Waiting ${Math.ceil(waitTime / 1000)}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return this.waitForSlot(); 
            }
        }
        
        this.requestTimestamps.push(now);
    }
};

const groqClient = {
    async callGroq(inputMajorName, majorNames) {
        try {
            await rateLimiter.waitForSlot();
            
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${groqApiKey}`
                },
                body: JSON.stringify({
                    model: 'openai/gpt-oss-120b',
                    messages: [
                        {
                            role: 'user',
                            content: `Cho danh sách các ngành đại học: ${majorNames}
                    
Tên ngành được nhập: "${inputMajorName}"

Tìm ngành phù hợp nhất từ danh sách. Trả về JSON:
{
  "matchedMajor": "tên ngành từ danh sách",
  "confidence": 0.0 đến 1.0,
  "reason": "lý do match"
}

Chỉ trả về JSON, không có text khác.`
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 200
                })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Groq API error:', error);
                return null;
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            
            if (!content) {
                console.warn('No content from Groq response');
                return null;
            }

            let parsed = null;
            try {
                parsed = JSON.parse(content);
                return parsed;
            } catch (e) {
                console.log('[Groq] Direct parse failed, extracting JSON object...');
            }

            const startIndex = content.indexOf('{');
            const endIndex = content.lastIndexOf('}');
            
            if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
                console.warn('No valid JSON object found in response:', content.substring(0, 200));
                return null;
            }

            const jsonString = content.substring(startIndex, endIndex + 1);
            
            try {
                parsed = JSON.parse(jsonString);
                return parsed;
            } catch (parseError) {
                console.warn('Failed to parse extracted JSON:', jsonString.substring(0, 200));
                return null;
            }
        } catch (error) {
            console.error('Error calling Groq API:', error);
            return null;
        }
    }
};

const findOrCreateMajorMapping = async (inputMajorName, availableMajors) => {
    try {
        const cached = await MajorMapping.findOne({
            inputName: inputMajorName.toLowerCase()
        });
        
        if (cached && cached.mappedMajorId) {
            console.log(`[MajorMapping] Cache hit for: "${inputMajorName}"`);
            return {
                majorId: cached.mappedMajorId,
                confidence: cached.confidence,
                cached: true
            };
        }
        
        const majorNames = availableMajors.map(m => m.name).join(', ');
        
        console.log(`[MajorMapping] Calling Groq for: "${inputMajorName}"`);
        const aiResponse = await groqClient.callGroq(inputMajorName, majorNames);
        
        if (!aiResponse || !aiResponse.matchedMajor) {
            console.warn(`[MajorMapping] AI match failed for: "${inputMajorName}"`);
            return { majorId: null, confidence: 0, cached: false };
        }
        
        const matchedMajor = availableMajors.find(m => 
            m.name.toLowerCase() === aiResponse.matchedMajor.toLowerCase()
        );
        
        if (!matchedMajor) {
            console.warn(`[MajorMapping] Matched major not found in DB: "${aiResponse.matchedMajor}"`);
            return { majorId: null, confidence: 0, cached: false };
        }
        
        try {
            await MajorMapping.findOneAndUpdate(
                { inputName: inputMajorName.toLowerCase() },
                {
                    inputName: inputMajorName.toLowerCase(),
                    displayName: inputMajorName,
                    mappedMajorId: matchedMajor._id,
                    mappedMajorName: matchedMajor.name,
                    confidence: aiResponse.confidence || 0.8,
                    reason: aiResponse.reason
                },
                { upsert: true, new: true }
            );
            
            console.log(`[MajorMapping] Cached: "${inputMajorName}" -> "${matchedMajor.name}"`);
        } catch (cacheError) {
            console.error('Error caching major mapping:', cacheError);
        }
        
        return {
            majorId: matchedMajor._id,
            confidence: aiResponse.confidence || 0.8,
            cached: false
        };
        
    } catch (error) {
        console.error('Error in findOrCreateMajorMapping:', error);
        return { majorId: null, confidence: 0, cached: false };
    }
};

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
        
        const subjectScores = await convertAcademicTranscriptToScores(studentProfile.academicTranscript);
        
        let softSkillsScores = {};
        if (studentProfile.softSkills && Array.isArray(studentProfile.softSkills)) {
            const skills = await SoftSkill.find({ 
                _id: { $in: studentProfile.softSkills } 
            }).select('softSkillName');
            
            if (skills && skills.length > 0) {
                skills.forEach(skill => {
                    const normalizedName = skill.softSkillName?.toLowerCase().replace(/\s+/g, '') || 'unknown';
                    softSkillsScores[normalizedName] = 6;
                });
            }
        }
        
        const features = extractFeatures({
            mbtiType: studentProfile.mbtiResult?.type,
            hollandCode: studentProfile.hollandResult?.scores,
            subjectScores: subjectScores,
            gpa: studentProfile.gpa,
            softSkills: softSkillsScores
        });
        
        const featureNames = getFeatureNames();
        const featureArray = featuresToArray(features, featureNames);
        
        console.log('[Prediction] Features extracted:', featureArray.slice(0, 15));
        
        const topKPredictions = model.predictTopK(featureArray, 3);
        
        let reverseMajorIdMap = {};
        console.log('[Prediction] modelVersion.reverseMajorIdMap type:', typeof modelVersion.reverseMajorIdMap);
        console.log('[Prediction] modelVersion.reverseMajorIdMap is Map:', modelVersion.reverseMajorIdMap instanceof Map);
        
        if (modelVersion.reverseMajorIdMap) {
            if (modelVersion.reverseMajorIdMap instanceof Map) {
                reverseMajorIdMap = Object.fromEntries(modelVersion.reverseMajorIdMap);
            }
            else if (typeof modelVersion.reverseMajorIdMap.toObject === 'function') {
                reverseMajorIdMap = modelVersion.reverseMajorIdMap.toObject();
            }
            else {
                reverseMajorIdMap = modelVersion.reverseMajorIdMap;
            }
        }
        
        console.log('[Prediction] reverseMajorIdMap after convert:', Object.keys(reverseMajorIdMap).slice(0, 5));
        console.log('[Prediction] topKPredictions:', topKPredictions);
        
        const majorIdsToFetch = topKPredictions
            .map(p => {
                const key = String(p.majorId);
                const id = reverseMajorIdMap[key];
                console.log(`[Prediction] Lookup key "${key}" → "${id}"`);
                return id;
            })
            .filter(id => id && id !== 'undefined');
        
        console.log('[Prediction] majorIdsToFetch:', majorIdsToFetch);
        
        if (majorIdsToFetch.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Không thể chuyển đổi kết quả dự đoán sang ObjectId',
                error: 'reverseMajorIdMap lookup failed',
                debug: { 
                    reverseMajorIdMapKeys: Object.keys(reverseMajorIdMap),
                    reverseMajorIdMapSample: Object.fromEntries(Object.entries(reverseMajorIdMap).slice(0, 3)),
                    topKPredictions, 
                    majorIdsToFetch 
                }
            });
        }
        
        const majors = await Major.find({ _id: { $in: majorIdsToFetch } });
        const majorMap = {};
        majors.forEach(m => {
            majorMap[m._id.toString()] = m;
        });
        
        const mbtiType = studentProfile.mbtiResult?.type || null;
        const mbtiDesc = mbtiType ? mbtiDescriptions[mbtiType] : null;
        
        const hollandScores = studentProfile.hollandResult?.scores || {};
        const topHollandCodes = Object.entries(hollandScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([code, score]) => ({
                code,
                score,
                description: hollandDescriptions[code]
            }))
            .filter(item => item.description);
        
        const recommendations = topKPredictions.map((pred, index) => {
            const majorId = reverseMajorIdMap[String(pred.majorId)];
            const major = majorId ? majorMap[majorId] : null;
            
            if (!major) {
                console.warn(`Major not found for ID: ${majorId}`);
                return null;
            }
            
            let reason = [];
            
            if (mbtiDesc && mbtiDesc.careers.some(c => major.name.includes(c))) {
                reason.push(`Phù hợp với loại hình công việc cho ${mbtiDesc.vietnameseName}`);
            }
            
            topHollandCodes.forEach(({code, description}) => {
                if (description && description.majorTypes.some(t => major.category.includes(t))) {
                    reason.push(`Phù hợp với hướng ${description.name}`);
                }
            });
            
            if (studentProfile.gpa) {
                reason.push(`Dựa trên GPA ${studentProfile.gpa.toFixed(1)}`);
            }
            
            return {
                majorId: major._id,
                name: major.name,
                category: major.category,
                matchScore: pred.probability,
                reason: reason.length > 0 ? reason[0] : 'Dựa trên phân tích dữ liệu học sinh'
            };
        }).filter(r => r !== null);
        
        if (recommendations.length === 0) {
            console.log('[Recommendation] No model predictions, using fallback logic');
            
            const hollandCodes = Object.keys(hollandScores || {})
                .sort((a, b) => (hollandScores[b] || 0) - (hollandScores[a] || 0))
                .slice(0, 2);
            
            const categoryKeywords = {
                'R': ['kỹ thuật', 'xây dựng', 'công nghiệp'],
                'I': ['công nghệ', 'khoa học', 'research'],
                'A': ['design', 'nghệ thuật', 'truyền thông'],
                'S': ['giáo dục', 'xã hội', 'tâm lý'],
                'E': ['kinh tế', 'quản lý', 'bán hàng'],
                'C': ['kế toán', 'quản lý', 'hành chính']
            };
            
            const fallbackMajors = await Major.find({
                $or: hollandCodes.map(code => ({
                    name: { $regex: categoryKeywords[code]?.join('|') || code, $options: 'i' }
                }))
            }).limit(3);
            
            if (fallbackMajors.length > 0) {
                fallbackMajors.forEach((major, index) => {
                    recommendations.push({
                        majorId: major._id,
                        name: major.name,
                        category: major.category,
                        matchScore: 0.7 - (index * 0.15),
                        reason: `Phù hợp với profil Holland của bạn`
                    });
                });
            }
        }
        
        if (recommendations.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy khuyến nghị. Vui lòng đảm bảo bạn đã làm đầy đủ các bài trắc nghiệm MBTI và Holland.',
                data: {
                    studentId,
                    reason: 'No recommendations available for your profile',
                    hint: 'Hãy hoàn thành các bài trắc nghiệm MBTI, Holland và cập nhật điểm số của bạn'
                }
            });
        }
        
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
                personalityProfile: mbtiType ? {
                    mbtiType,
                    mbtiName: mbtiDesc?.vietnameseName,
                    mbtiDescription: mbtiDesc?.description,
                    mbtiStrengths: mbtiDesc?.strengths,
                    mbtiCareers: mbtiDesc?.careers
                } : null,
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

export const exportTrainingDataTemplate = async (req, res) => {
    try {
        const ExcelJS = (await import('exceljs')).default;
        const { default: Subject } = await import('../models/Subject.js');
        const { default: SoftSkill } = await import('../models/SoftSkill.js');
        const { default: Major } = await import('../models/Major.js');
        
        const subjects = await Subject.find().select('name');
        const softSkills = await SoftSkill.find().select('softSkillName');
        const majors = await Major.find().select('name').limit(5); // Get sample majors
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Training Data Template');
        
        const headers = [
            'MBTI Type',
            'Holland - Thực hành (0-100)',
            'Holland - Nghiên cứu (0-100)',
            'Holland - Sáng tạo (0-100)',
            'Holland - Xã hội (0-100)',
            'Holland - Kinh doanh (0-100)',
            'Holland - Hành chính (0-100)',
            'GPA (0-10)'
        ];
        
        const subjectHeaders = [];
        subjects.forEach(subject => {
            subjectHeaders.push(`Điểm ${subject.name}`);
        });
        headers.push(...subjectHeaders);
        
        const softSkillHeaders = [];
        softSkills.forEach(skill => {
            softSkillHeaders.push(`${skill.softSkillName} (0/1)`);
        });
        headers.push(...softSkillHeaders);
        
        headers.push('Ngành đang học (kết quả thực tế)', 'Ngành được khuyến nghị', 'Điểm khớp (%)', 'Lý do khuyến nghị');
        
        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
        
        worksheet.columns.forEach(col => {
            col.width = 18;
        });
        
        worksheet.addRow([]);
        const instructionRow = worksheet.addRow([
            'HƯỚNG DẪN: Hàng này là ví dụ. Xóa nó trước khi upload. Các ô trống = không có dữ liệu. Hàng 1 không được thay đổi.'
        ]);
        worksheet.mergeCells('A3:L3');
        const instructionCell = worksheet.getCell('A3');
        instructionCell.font = { italic: true, color: { argb: 'FFFF0000' } };
        instructionCell.alignment = { wrapText: true, vertical: 'top' };
        
        const exampleRecords = await TrainingData.find().limit(3).lean();
        
        if (exampleRecords.length > 0) {
            worksheet.addRow([]); 
            
            exampleRecords.forEach((record) => {
                const exampleRow = [
                    record.mbtiType || '',
                    record.hollandCode?.realistic || '',
                    record.hollandCode?.investigative || '',
                    record.hollandCode?.artistic || '',
                    record.hollandCode?.social || '',
                    record.hollandCode?.enterprising || '',
                    record.hollandCode?.conventional || '',
                    record.gpa || ''
                ];
                
                subjectHeaders.forEach((header) => {
                    const subjectKey = header.replace('Điểm ', '').replace(/\s+/g, '').toLowerCase();
                    exampleRow.push(record.subjectScores?.[subjectKey] || '');
                });
                
                softSkillHeaders.forEach((header) => {
                    const skillKey = header.replace(' (0/1)', '').replace(/\s+/g, '').toLowerCase();
                    const value = record.softSkills?.[skillKey];
                    exampleRow.push(value === 1 ? 1 : value === 0 ? 0 : '');
                });
                
                exampleRow.push('Kĩ thuật phần mềm');
                
                const recommendedMajor = record.recommendedMajors?.[0];
                exampleRow.push(
                    recommendedMajor?.majorId?.toString() || '',
                    recommendedMajor?.matchScore || '',
                    recommendedMajor?.reason || ''
                );
                
                const dataRow = worksheet.addRow(exampleRow);
                dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
            });
        }
        
        const buffer = await workbook.xlsx.writeBuffer();
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="TrainingDataTemplate.xlsx"');
        res.send(buffer);
        
    } catch (error) {
        console.error('Error exporting training data template:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi export template',
            error: error.message
        });
    }
};

export const importTrainingDataFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng upload file Excel'
            });
        }
        
        const ExcelJS = (await import('exceljs')).default;
        const { default: Subject } = await import('../models/Subject.js');
        const { default: SoftSkill } = await import('../models/SoftSkill.js');
        const { default: Major } = await import('../models/Major.js');
        
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        
        const worksheet = workbook.worksheets[0];
        
        if (!worksheet) {
            return res.status(400).json({
                success: false,
                message: 'File Excel không có dữ liệu'
            });
        }
        
        const headers = [];
        const headerRow = worksheet.getRow(1);
        
        if (!headerRow) {
            return res.status(400).json({
                success: false,
                message: 'File Excel không có header row'
            });
        }
        
        headerRow.eachCell((cell) => {
            if (cell.value) {
                headers.push(cell.value.toString().trim());
            }
        });
        
        if (headers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'File Excel không có headers'
            });
        }
        
        console.log(`[Import] Detected ${headers.length} headers: ${headers.slice(0, 5).join(', ')}...`);
        
        const subjects = await Subject.find();
        const subjectMap = {};
        subjects.forEach(s => {
            subjectMap[s.name.toLowerCase()] = s._id;
        });
        
        const softSkills = await SoftSkill.find();
        const softSkillMap = {};
        softSkills.forEach(s => {
            softSkillMap[s.softSkillName.toLowerCase()] = s.softSkillName;
        });
        
        const majors = await Major.find();
        const majorMap = {};
        majors.forEach(m => {
            majorMap[m.name.toLowerCase()] = m._id;
        });
        
        const results = {
            success: 0,
            failed: 0,
            errors: [],
            ids: []
        };
        
        for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
            try {
                const row = worksheet.getRow(rowNum);
                const rowData = {};
                
                row.eachCell((cell, colIndex) => {
                    if (colIndex <= headers.length && cell.value !== null && cell.value !== '') {
                        const header = headers[colIndex - 1];
                        rowData[header] = cell.value;
                    }
                });
                
                if (Object.keys(rowData).length === 0) continue; // Skip empty rows
                
                const trainingData = {
                    dataSourceType: 'imported_dataset',
                    dataSourceName: 'Excel Import',
                };
                
                if (rowData['MBTI Type']) {
                    trainingData.mbtiType = rowData['MBTI Type'].toString().toUpperCase();
                }
                
                trainingData.hollandCode = {};
                const hollandMapping = {
                    'Holland - Thực hành (0-100)': 'realistic',
                    'Holland - Nghiên cứu (0-100)': 'investigative',
                    'Holland - Sáng tạo (0-100)': 'artistic',
                    'Holland - Xã hội (0-100)': 'social',
                    'Holland - Kinh doanh (0-100)': 'enterprising',
                    'Holland - Hành chính (0-100)': 'conventional'
                };
                
                Object.entries(hollandMapping).forEach(([header, field]) => {
                    if (rowData[header] !== undefined && rowData[header] !== null) {
                        trainingData.hollandCode[field] = parseInt(rowData[header]) || 0;
                    }
                });
                
                if (rowData['GPA (0-10)'] !== undefined && rowData['GPA (0-10)'] !== null) {
                    trainingData.gpa = parseFloat(rowData['GPA (0-10)']);
                }
                
                trainingData.subjectScores = {};
                headers.forEach(header => {
                    if (header.startsWith('Điểm ')) {
                        const subjectName = header.replace('Điểm ', '').toLowerCase();
                        if (rowData[header] !== undefined && rowData[header] !== null) {
                            const subjectKey = subjectName.replace(/\s+/g, '');
                            trainingData.subjectScores[subjectKey] = parseFloat(rowData[header]) || 0;
                        }
                    }
                });
                
                trainingData.softSkills = {};
                headers.forEach(header => {
                    if (header.includes('Kỹ năng')) {
                        const skillName = header.replace(' (0/1)', '').toLowerCase();
                        if (rowData[header] !== undefined && rowData[header] !== null) {
                            const skillKey = skillName.replace(/\s+/g, '');
                            const value = rowData[header].toString().trim().toLowerCase();

                            //console.log(`[Row ${rowNum}] Soft Skill "${skillName}": "${value}"`);

                            if (value === '1' || value === 'yes' || value === 'có' || value === 'true') {
                                trainingData.softSkills[skillKey] = 1;
                            }
                        }
                    }
                });
                
                if (rowData['Ngành đang học (kết quả thực tế)']) {
                    const inputMajorName = rowData['Ngành đang học (kết quả thực tế)'].toString().trim();
                    
                    let actualMajorId = majorMap[inputMajorName.toLowerCase()];
                    let matchConfidence = 1.0;
                    
                    if (!actualMajorId) {
                        console.log(`[Row ${rowNum}] Exact match failed, using Groq AI for: "${inputMajorName}"`);
                        const aiMatch = await findOrCreateMajorMapping(inputMajorName, majors);
                        
                        if (aiMatch.majorId) {
                            actualMajorId = aiMatch.majorId;
                            matchConfidence = aiMatch.confidence;
                            console.log(`[Row ${rowNum}] AI matched to: ${aiMatch.cached ? '(cached)' : '(new)'}`);
                        }
                    }
                    
                    if (actualMajorId) {
                        trainingData.actualMajorId = actualMajorId;
                        trainingData.majorMappingConfidence = matchConfidence;
                    } else {
                        console.warn(`[Row ${rowNum}] Could not match major: "${inputMajorName}"`);
                    }
                }
                
                trainingData.recommendedMajors = [];
                if (rowData['Ngành được khuyến nghị'] && rowData['Điểm khớp (%)']) {
                    const majorName = rowData['Ngành được khuyến nghị'].toString().toLowerCase();
                    const majorId = majorMap[majorName];
                    
                    if (majorId) {
                        trainingData.recommendedMajors.push({
                            majorId,
                            matchScore: parseFloat(rowData['Điểm khớp (%)']) || 50,
                            reason: rowData['Lý do khuyến nghị'] || 'Imported from Excel',
                            isPrimary: true
                        });
                    }
                }
                
                const newTrainingData = new TrainingData(trainingData);
                
                const validation = validateTrainingData(newTrainingData);
                if (!validation.isValid) {
                    newTrainingData.isValid = false;
                    newTrainingData.validationErrors = validation.errors;
                }
                
                newTrainingData.completenessScore = calculateCompletenessScore(newTrainingData);
                
                await newTrainingData.save();
                results.success++;
                results.ids.push(newTrainingData._id);
                
            } catch (error) {
                results.failed++;
                results.errors.push({
                    row: rowNum,
                    error: error.message
                });
            }
        }
        
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting temp file:', err);
        });
        
        res.status(201).json({
            success: true,
            message: `Imported ${results.success}/${results.success + results.failed} records`,
            data: {
                successCount: results.success,
                failedCount: results.failed,
                trainingDataIds: results.ids,
                errors: results.errors.length > 0 ? results.errors : undefined
            }
        });
        
    } catch (error) {
        console.error('Error importing training data from Excel:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi import training data từ Excel',
            error: error.message
        });
    }
};

export const trainRecommendationModel = async (req, res) => {
    try {
        console.log('[Training] Starting Random Forest model training with feedback integration...');
        
        // Lấy tất cả training data có actualMajorId (ground truth)
        const trainingDataRecords = await TrainingData.find({
            actualMajorId: { $exists: true, $ne: null }
        }).populate('actualMajorId', 'name _id').lean();
        
            // Lấy feedback data để tăng cường training
        const feedbackRecords = await RecommendationFeedBack.find({
            isHelpful: true  // Chỉ lấy positive feedback để tăng cường training
        }).populate('majorId', 'name _id')
          .populate('recommendationId')
          .lean();
        
        console.log(`[Training] Found ${trainingDataRecords.length} base records, ${feedbackRecords.length} positive feedback records`);
        
        if (trainingDataRecords.length < 30) {
            return res.status(400).json({
                success: false,
                message: `Cần tối thiểu 30 records để train. Hiện có ${trainingDataRecords.length}`,
                data: { recordCount: trainingDataRecords.length }
            });
        }
        
        console.log(`[Training] Total records for training: ${trainingDataRecords.length + feedbackRecords.length}`);
        
        // Extract features từ training data
        const { default: Subject } = await import('../models/Subject.js');
        const { default: SoftSkill } = await import('../models/SoftSkill.js');
        
        const subjects = await Subject.find().select('name').lean();
        const softSkills = await SoftSkill.find().select('softSkillName').lean();
        
        // Chuẩn bị feature array và labels
        const features = [];
        const labels = [];
        const majorIdMap = {};
        let majorIdCounter = 0;
        
        const allTrainingData = [...trainingDataRecords];
        
        // Thêm feedback data vào training set
        for (const feedback of feedbackRecords) {
            if (feedback.majorId && feedback.majorId._id) {
                // Tạo training record từ feedback
                const feedbackTrainingRecord = {
                    actualMajorId: feedback.majorId,
                    mbtiType: feedback.recommendationId?.mbtiType,
                    hollandCode: feedback.recommendationId?.hollandCode || {},
                    gpa: feedback.recommendationId?.gpa,
                    subjectScores: feedback.recommendationId?.subjectScores || {},
                    softSkills: feedback.recommendationId?.softSkills || {},
                    isFeedbackDerived: true 
                };
                allTrainingData.push(feedbackTrainingRecord);
            }
        }
        
        console.log(`[Training] Total samples after feedback integration: ${allTrainingData.length}`);
        
        for (const record of allTrainingData) {
            try {
                const majorId = record.actualMajorId?._id?.toString() || record.actualMajorId?.toString();
                if (!majorId) continue;
                
                if (!majorIdMap[majorId]) {
                    majorIdMap[majorId] = majorIdCounter++;
                }
                
                const featureVector = [];
                
                // 1. MBTI Type (convert to numeric)
                const mbtiTypes = ['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP',
                                   'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'];
                const mbtiIndex = mbtiTypes.indexOf(record.mbtiType) || 0;
                featureVector.push(mbtiIndex);
                
                // 2. Holland Code (6 dimensions)
                featureVector.push(record.hollandCode?.realistic || 0);
                featureVector.push(record.hollandCode?.investigative || 0);
                featureVector.push(record.hollandCode?.artistic || 0);
                featureVector.push(record.hollandCode?.social || 0);
                featureVector.push(record.hollandCode?.enterprising || 0);
                featureVector.push(record.hollandCode?.conventional || 0);
                
                // 3. GPA
                featureVector.push(record.gpa || 0);
                
                // 4. Subject scores
                for (const subject of subjects) {
                    const subjectKey = subject.name.replace(/\s+/g, '').toLowerCase();
                    featureVector.push(record.subjectScores?.[subjectKey] || 0);
                }
                
                // 5. Soft skills (binary 0/1)
                for (const skill of softSkills) {
                    const skillKey = skill.softSkillName.replace(/\s+/g, '').toLowerCase();
                    featureVector.push(record.softSkills?.[skillKey] ? 1 : 0);
                }
                
                features.push(featureVector);
                labels.push(majorIdMap[majorId]);
                
            } catch (recordError) {
                console.warn(`[Training] Skipping record due to error:`, recordError.message);
                continue;
            }
        }
        
        console.log(`[Training] Extracted ${features.length} valid records with ${features[0]?.length || 0} features`);
        
        if (features.length < 30) {
            return res.status(400).json({
                success: false,
                message: `Chỉ ${features.length} records hợp lệ. Cần tối thiểu 30.`,
                data: { validRecords: features.length }
            });
        }
        
        // Train Random Forest model
        const model = new MajorRecommendationModel();
        model.train(features, labels);
        
        // Tính metrics
        const predictions = features.map(f => model.predict(f));
        let correctCount = 0;
        for (let i = 0; i < predictions.length; i++) {
            if (predictions[i] === labels[i]) {
                correctCount++;
            }
        }
        const accuracy = (correctCount / labels.length) * 100;
        
        console.log(`[Training] Model trained. Accuracy: ${accuracy.toFixed(2)}%`);
        console.log(`[Training] Base records: ${trainingDataRecords.length}, Feedback-derived: ${feedbackRecords.length}`);
        
        const reverseMajorIdMap = {};
        Object.entries(majorIdMap).forEach(([majorId, numericIndex]) => {
            reverseMajorIdMap[numericIndex] = majorId;
        });
        
        // Lưu model vào file
        const modelsDir = path.join(__dirname, '../models_ml');
        if (!fs.existsSync(modelsDir)) {
            fs.mkdirSync(modelsDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const modelPath = path.join(modelsDir, `model_${timestamp}.json`);
        const modelJSON = model.toJSON();
        
        modelJSON.reverseMajorIdMap = reverseMajorIdMap;
        
        fs.writeFileSync(modelPath, JSON.stringify(modelJSON, null, 2));
        console.log(`[Training] Model saved to: ${modelPath}`);
        
        // Lưu model metadata vào MongoDB
        const modelVersion = new ModelVersion({
            version: await ModelVersion.countDocuments() + 1,
            modelPath: modelPath,
            modelType: 'random_forest',
            trainingDataCount: features.length,
            accuracy: accuracy,
            majorIdMap: majorIdMap,
            reverseMajorIdMap: reverseMajorIdMap,
            featureNames: [
                'MBTI Type',
                'Holland - Realistic',
                'Holland - Investigative',
                'Holland - Artistic',
                'Holland - Social',
                'Holland - Enterprising',
                'Holland - Conventional',
                'GPA',
                ...subjects.map(s => `Subject - ${s.name}`),
                ...softSkills.map(s => `Skill - ${s.softSkillName}`)
            ],
            isActive: true,
            createdAt: new Date(),
            trainedAt: new Date()
        });
        
        // Deactivate previous models
        await ModelVersion.updateMany({ _id: { $ne: modelVersion._id } }, { isActive: false });
        
        const savedModel = await modelVersion.save();
        
        res.status(200).json({
            success: true,
            message: 'Model training completed successfully with feedback integration',
            data: {
                version: savedModel.version,
                accuracy: accuracy.toFixed(2),
                trainingRecords: features.length,
                baseRecords: trainingDataRecords.length,
                feedbackDerivedRecords: feedbackRecords.length,
                majorCount: Object.keys(majorIdMap).length,
                featureCount: features[0]?.length || 0,
                modelPath: modelPath,
                isActive: true,
                feedbackImpact: {
                    positiveHelpful: feedbackRecords.length,
                    percentageFromFeedback: ((feedbackRecords.length / features.length) * 100).toFixed(2) + '%'
                }
            }
        });
        
    } catch (error) {
        console.error('Error training model:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi train model',
            error: error.message
        });
    }
};

export const saveFeedback = async (req, res) => {
    try {
        const userId = req.userId;
        const { recommendationId, majorId, isHelpful, userSelectionStatus, comments } = req.body;

        if (!majorId) {
            return res.status(400).json({
                success: false,
                message: 'majorId là bắt buộc'
            });
        }

        if (isHelpful === null || isHelpful === undefined) {
            return res.status(400).json({
                success: false,
                message: 'isHelpful là bắt buộc'
            });
        }

        const major = await Major.findById(majorId);
        if (!major) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy ngành'
            });
        }

        const studentProfile = await StudentProfile.findOne({ userId });
        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hồ sơ học sinh'
            });
        }

        let feedback = await RecommendationFeedBack.findOne({
            majorId,
            studentId: studentProfile._id
        });

        if (feedback) {
            feedback.isHelpful = isHelpful;
            if (userSelectionStatus) feedback.userSelectionStatus = userSelectionStatus;
            if (comments !== undefined) feedback.comments = comments;
        } else {
            feedback = new RecommendationFeedBack({
                studentId: studentProfile._id,
                majorId,
                isHelpful,
                userSelectionStatus: userSelectionStatus || 'none',
                comments: comments || ''
            });
        }

        await feedback.save();

        const totalFeedbacks = await RecommendationFeedBack.countDocuments({ majorId });
        const helpfulFeedbacks = await RecommendationFeedBack.countDocuments({ 
            majorId, 
            isHelpful: true 
        });
        const enrolledCount = await RecommendationFeedBack.countDocuments({ 
            majorId, 
            userSelectionStatus: 'enrolled' 
        });

        res.status(201).json({
            success: true,
            message: 'Phản hồi đã được lưu. Cảm ơn bạn đã giúp cải thiện hệ thống!',
            data: {
                feedback,
                stats: {
                    totalFeedbacks,
                    helpfulRate: ((helpfulFeedbacks / totalFeedbacks) * 100).toFixed(1),
                    enrolledCount
                }
            }
        });

    } catch (error) {
        console.error('Error saving feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lưu phản hồi',
            error: error.message
        });
    }
};

