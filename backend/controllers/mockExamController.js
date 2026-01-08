import MockExam from '../models/MockExam.js';
import SubjectCombination from '../models/SubjectCombination.js';
import User from '../models/User.js';
import ExamResult from '../models/ExamResult.js';
import { parseExcelQuestions, validateQuestions } from '../utils/excelParser.js';

const validateQuestionsStructure = (questions) => {
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
        } else {
            q.options.forEach((opt, optIndex) => {
                if (!opt || typeof opt !== 'string' || opt.trim() === '') {
                    errors.push(`Question ${index + 1}, Option ${optIndex + 1}: Lựa chọn không được trống`);
                }
            });
        }
        
        if (!q.answer || typeof q.answer !== 'string' || q.answer.trim() === '') {
            errors.push(`Question ${index + 1}: Đáp án không hợp lệ`);
        } else if (q.options && !q.options.includes(q.answer)) {
            errors.push(`Question ${index + 1}: Đáp án không nằm trong các lựa chọn`);
        }
    });
    
    return {
        valid: errors.length === 0,
        errors
    };
};


export const getAllMockExams = async (req, res) => {
    try {
        const { search, sort = '-createdAt', limit = 10, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } }
            ];
        }

        const exams = await MockExam.find(filter)
            .populate('subjectCombination', 'combinationName subjects')
            .skip(skip)
            .limit(parseInt(limit))
            .sort(sort);

        const total = await MockExam.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: exams,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get mock exams error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách đề thi',
            error: error.message
        });
    }
};

export const getMockExamById = async (req, res) => {
    try {
        const { examId } = req.params;

        const exam = await MockExam.findById(examId)
            .populate('subjectCombination', 'combinationName subjects');

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Đề thi không tồn tại'
            });
        }

        res.status(200).json({
            success: true,
            data: exam
        });

    } catch (error) {
        console.error('Get mock exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy chi tiết đề thi',
            error: error.message
        });
    }
};

export const createMockExam = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.body.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Không xác thực được người dùng'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Không xác thực được người dùng'
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin được phép tạo đề thi'
            });
        }

        const { title, subjectCombination, duration, questions } = req.body;

        if (!title || !subjectCombination || !duration || !questions) {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu thiếu: title, subjectCombination, duration, questions'
            });
        }

        const validation = validateQuestionsStructure(questions);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu câu hỏi không hợp lệ',
                errors: validation.errors
            });
        }

        const subjectComb = await SubjectCombination.findById(subjectCombination);
        if (!subjectComb) {
            return res.status(400).json({
                success: false,
                message: 'Tổ hợp môn không tồn tại'
            });
        }

        if (typeof duration !== 'number' || duration <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Thời gian làm bài phải là số dương'
            });
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Đề thi phải có ít nhất 1 câu hỏi'
            });
        }

        const exam = new MockExam({
            title,
            subjectCombination,
            duration,
            questions
        });

        await exam.save();

        const populatedExam = await exam.populate('subjectCombination', 'combinationName subjects');

        res.status(201).json({
            success: true,
            message: 'Tạo đề thi thành công',
            data: populatedExam
        });

    } catch (error) {
        console.error('Create mock exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo đề thi',
            error: error.message
        });
    }
};

export const updateMockExam = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.body.userId;
        const { examId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Không xác thực được người dùng'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Không xác thực được người dùng'
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin được phép cập nhật đề thi'
            });
        }

        const exam = await MockExam.findById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Đề thi không tồn tại'
            });
        }

        const { title, subjectCombination, duration, questions } = req.body;

        if (title !== undefined) {
            exam.title = title;
        }

        if (subjectCombination !== undefined) {
            const subjectComb = await SubjectCombination.findById(subjectCombination);
            if (!subjectComb) {
                return res.status(400).json({
                    success: false,
                    message: 'Tổ hợp môn không tồn tại'
                });
            }
            exam.subjectCombination = subjectCombination;
        }

        if (duration !== undefined) {
            if (typeof duration !== 'number' || duration <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Thời gian làm bài phải là số dương'
                });
            }
            exam.duration = duration;
        }

        if (questions !== undefined) {
            const validation = validateQuestionsStructure(questions);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    message: 'Dữ liệu câu hỏi không hợp lệ',
                    errors: validation.errors
                });
            }
            exam.questions = questions;
        }

        await exam.save();

        const populatedExam = await exam.populate('subjectCombination', 'combinationName subjects');

        res.status(200).json({
            success: true,
            message: 'Cập nhật đề thi thành công',
            data: populatedExam
        });
    
    } catch (error) {
        console.error('Update mock exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật đề thi',
            error: error.message
        });
    }
};

export const deleteMockExam = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.body.userId;
        const { examId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Không xác thực được người dùng'
            });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Không xác thực được người dùng'
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin được phép xóa đề thi'
            });
        }

        const exam = await MockExam.findById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Đề thi không tồn tại'
            });
        }

        await MockExam.deleteOne({ _id: examId });

        res.status(200).json({
            success: true,
            message: 'Xóa đề thi thành công'
        });

    } catch (error) {
        console.error('Delete mock exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xóa đề thi',
            error: error.message
        });
    }
};

export const importQuestionsFromExcel = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.body.userId;
        const { examId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Không xác thực được người dùng'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Không xác thực được người dùng'
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin được phép import questions'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng upload file Excel'
            });
        }

        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/octet-stream'
        ];

        if (!allowedMimes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng upload file Excel (.xlsx hoặc .xls)'
            });
        }

        let questions;
        try {
            questions = parseExcelQuestions(req.file.buffer);
        } catch (parseError) {
            return res.status(400).json({
                success: false,
                message: parseError.message
            });
        }

        if (questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'File Excel không chứa câu hỏi hợp lệ'
            });
        }
        const validation = validateQuestions(questions);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu câu hỏi không hợp lệ',
                errors: validation.errors
            });
        }

        if (examId && examId !== 'undefined') {
            const exam = await MockExam.findById(examId);
            if (!exam) {
                return res.status(404).json({
                    success: false,
                    message: 'Đề thi không tồn tại'
                });
            }

            const action = req.body.action || 'replace';
            
            if (action === 'append') {
                exam.questions = [...exam.questions, ...questions];
            } else {
                exam.questions = questions;
            }

            await exam.save();
            const populatedExam = await exam.populate('subjectCombination', 'combinationName subjects');

            return res.status(200).json({
                success: true,
                message: `Import thành công ${questions.length} câu hỏi`,
                data: {
                    exam: populatedExam,
                    importedCount: questions.length
                }
            });
        }

        res.status(200).json({
            success: true,
            message: `Parse thành công ${questions.length} câu hỏi`,
            data: {
                questions,
                count: questions.length,
                preview: questions.slice(0, 3)
            }
        });

    } catch (error) {
        console.error('Import questions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi import questions từ Excel',
            error: error.message
        });
    }
};

export const getMockExamForStudent = async (req, res) => {
    try {
        const { examId } = req.params;
        const userId = req.headers['x-user-id'] || req.query.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập'
            });
        }

        const exam = await MockExam.findById(examId)
            .populate('subjectCombination', 'combinationName subjects');

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Đề thi không tồn tại'
            });
        }

        const examForStudent = {
            _id: exam._id,
            title: exam.title,
            duration: exam.duration,
            subjectCombination: exam.subjectCombination,
            questions: exam.questions.map(q => ({
                _id: q._id,
                question: q.question,
                options: q.options
            })),
            createdAt: exam.createdAt
        };

        res.status(200).json({
            success: true,
            data: examForStudent
        });

    } catch (error) {
        console.error('Get mock exam for student error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy đề thi',
            error: error.message
        });
    }
};

export const submitMockExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const userId = req.headers['x-user-id'] || req.body.userId;
        const { answers } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập'
            });
        }

        if (!examId || !answers) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu examId hoặc answers'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        const exam = await MockExam.findById(examId)
            .populate('subjectCombination', 'combinationName subjects');

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Đề thi không tồn tại'
            });
        }

        if (!Array.isArray(answers) || answers.length !== exam.questions.length) {
            return res.status(400).json({
                success: false,
                message: `Cần cung cấp đáp án cho cả ${exam.questions.length} câu hỏi`
            });
        }

        let correctCount = 0;
        const scoringDetails = exam.questions.map((question, index) => {
            const studentAnswer = answers[index];
            const isCorrect = studentAnswer === question.answer;
            
            if (isCorrect) {
                correctCount++;
            }

            return {
                questionIndex: index + 1,
                question: question.question,
                studentAnswer: studentAnswer,
                correctAnswer: question.answer,
                isCorrect: isCorrect
            };
        });

        const scoreTotal = Math.round((correctCount / exam.questions.length) * 10 * 100) / 100;

        const weaknesses = scoringDetails
            .filter(detail => !detail.isCorrect)
            .slice(0, 3)
            .map(detail => `Câu ${detail.questionIndex}: ${detail.question.substring(0, 50)}...`);

        const strengths = scoringDetails
            .filter(detail => detail.isCorrect)
            .slice(0, 3)
            .map(detail => `Câu ${detail.questionIndex}`);

        const improvementTips = correctCount >= exam.questions.length * 0.8
            ? 'Bạn làm tốt! Tiếp tục ôn tập để nâng cao kiến thức.'
            : 'Bạn cần ôn tập lại những phần kiến thức còn yếu. Hãy xem lại các câu sai và học thêm lý thuyết.';

        const examResult = new ExamResult({
            studentId: userId,
            mockExamId: examId,
            scoreTotal: scoreTotal,
            scoreDetails: scoringDetails,
            weaknesses: weaknesses.length > 0 ? weaknesses : ['Không có'],
            strengths: strengths.length > 0 ? strengths : ['Tất cả'],
            improvementTips: improvementTips
        });

        await examResult.save();

        const populatedResult = await examResult
            .populate('mockExamId', 'title duration')
            .populate('studentId', 'fullName email');

        res.status(201).json({
            success: true,
            message: 'Nộp bài thi thành công',
            data: {
                result: populatedResult,
                correctCount: correctCount,
                totalQuestions: exam.questions.length,
                scorePercentage: Math.round((correctCount / exam.questions.length) * 100)
            }
        });

    } catch (error) {
        console.error('Submit mock exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi nộp bài thi',
            error: error.message
        });
    }
};

export const getExamResult = async (req, res) => {
    try {
        const { resultId } = req.params;
        const userId = req.headers['x-user-id'] || req.query.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập'
            });
        }

        const examResult = await ExamResult.findById(resultId)
            .populate('mockExamId', 'title duration subjectCombination')
            .populate('studentId', 'fullName email');

        if (!examResult) {
            return res.status(404).json({
                success: false,
                message: 'Kết quả thi không tồn tại'
            });
        }

        // Kiểm tra quyền: học sinh chỉ xem được kết quả của chính mình, admin xem được tất cả
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if (user.role !== 'admin' && examResult.studentId._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem kết quả này'
            });
        }

        res.status(200).json({
            success: true,
            data: examResult
        });

    } catch (error) {
        console.error('Get exam result error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy kết quả thi',
            error: error.message
        });
    }
};

export const getStudentExamResults = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.query.userId;
        const { limit = 10, page = 1, sort = '-takenAt' } = req.query;
        const skip = (page - 1) * limit;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        const results = await ExamResult.find({ studentId: userId })
            .populate('mockExamId', 'title duration subjectCombination')
            .skip(skip)
            .limit(parseInt(limit))
            .sort(sort);

        const total = await ExamResult.countDocuments({ studentId: userId });

        res.status(200).json({
            success: true,
            data: results,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get student exam results error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách kết quả thi',
            error: error.message
        });
    }
};

export const getAllExamResults = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.body.userId;
        const { limit = 10, page = 1, sort = '-takenAt', studentId } = req.query;
        const skip = (page - 1) * limit;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin được phép xem tất cả kết quả thi'
            });
        }

        const filter = {};
        if (studentId) {
            filter.studentId = studentId;
        }

        const results = await ExamResult.find(filter)
            .populate('mockExamId', 'title duration')
            .populate('studentId', 'fullName email')
            .skip(skip)
            .limit(parseInt(limit))
            .sort(sort);

        const total = await ExamResult.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: results,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get all exam results error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách kết quả thi',
            error: error.message
        });
    }
};

export const getStudentExamStats = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.query.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        const results = await ExamResult.find({ studentId: userId })
            .populate('mockExamId', 'title');

        if (results.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Học sinh chưa làm bài thi nào',
                data: {
                    totalExamsTaken: 0,
                    averageScore: 0,
                    highestScore: 0,
                    lowestScore: 0,
                    scores: []
                }
            });
        }

        const scores = results.map(r => r.scoreTotal);
        const averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);

        res.status(200).json({
            success: true,
            data: {
                totalExamsTaken: results.length,
                averageScore: averageScore,
                highestScore: highestScore,
                lowestScore: lowestScore,
                examHistory: results.map(r => ({
                    examTitle: r.mockExamId.title,
                    score: r.scoreTotal,
                    takenAt: r.takenAt
                }))
            }
        });

    } catch (error) {
        console.error('Get student exam stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thống kê điểm',
            error: error.message
        });
    }
};
