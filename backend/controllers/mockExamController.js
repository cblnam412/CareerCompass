import MockExam from '../models/MockExam.js';
import SubjectCombination from '../models/SubjectCombination.js';
import User from '../models/User.js';
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
