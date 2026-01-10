import PersonalityQuiz from '../models/PersonalityQuiz.js';
import QuizQuestion from '../models/QuizQuestion.js';
import QuizAttempt from '../models/QuizAttempt.js';
import StudentProfile from '../models/StudentProfile.js';
import {
    isValidObjectId,
    calculateMBTIResult,
    calculateHollandResult,
    validatePersonalityQuizData,
    validateQuestionData,
    getQuizStats
} from '../utils/quizUtils.js';


export const getAllPersonalityQuizzes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const quizzes = await PersonalityQuiz.find({ isActive: true })
            .skip(skip)
            .limit(limit)
            .select('-__v')
            .lean();

        const total = await PersonalityQuiz.countDocuments({ isActive: true });

        res.status(200).json({
            success: true,
            data: quizzes,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching personality quizzes:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách bài trắc nghiệm',
            error: error.message
        });
    }
};

export const getPersonalityQuizById = async (req, res) => {
    try {
        const { quizId } = req.params;

        if (!isValidObjectId(quizId)) {
            return res.status(400).json({
                success: false,
                message: 'ID bài trắc nghiệm không hợp lệ'
            });
        }

        const quiz = await PersonalityQuiz.findById(quizId).lean();

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Bài trắc nghiệm không tồn tại'
            });
        }

        const questions = await QuizQuestion.find({ quizId })
            .sort({ order: 1 })
            .select('-__v')
            .lean();

        res.status(200).json({
            success: true,
            data: {
                ...quiz,
                questions
            }
        });
    } catch (error) {
        console.error('Error fetching personality quiz:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin bài trắc nghiệm',
            error: error.message
        });
    }
};

export const createPersonalityQuiz = async (req, res) => {
    try {
        const { title, description, type } = req.body;

        const validation = validatePersonalityQuizData({ title, type });
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: validation.errors
            });
        }

        const newQuiz = new PersonalityQuiz({
            title,
            description: description || '',
            type,
            isActive: true,
            createdBy: req.user?._id
        });

        await newQuiz.save();

        res.status(201).json({
            success: true,
            message: 'Tạo bài trắc nghiệm thành công',
            data: newQuiz
        });
    } catch (error) {
        console.error('Error creating personality quiz:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo bài trắc nghiệm',
            error: error.message
        });
    }
};

export const updatePersonalityQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { title, description, type, isActive } = req.body;

        if (!isValidObjectId(quizId)) {
            return res.status(400).json({
                success: false,
                message: 'ID bài trắc nghiệm không hợp lệ'
            });
        }

        if (title || type) {
            const validation = validatePersonalityQuizData({ title, type });
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Dữ liệu không hợp lệ',
                    errors: validation.errors
                });
            }
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (type) updateData.type = type;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedQuiz = await PersonalityQuiz.findByIdAndUpdate(
            quizId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedQuiz) {
            return res.status(404).json({
                success: false,
                message: 'Bài trắc nghiệm không tồn tại'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật bài trắc nghiệm thành công',
            data: updatedQuiz
        });
    } catch (error) {
        console.error('Error updating personality quiz:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật bài trắc nghiệm',
            error: error.message
        });
    }
};

export const deletePersonalityQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;

        if (!isValidObjectId(quizId)) {
            return res.status(400).json({
                success: false,
                message: 'ID bài trắc nghiệm không hợp lệ'
            });
        }

        const quiz = await PersonalityQuiz.findByIdAndDelete(quizId);

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Bài trắc nghiệm không tồn tại'
            });
        }

        await QuizQuestion.deleteMany({ quizId });

        res.status(200).json({
            success: true,
            message: 'Xóa bài trắc nghiệm thành công'
        });
    } catch (error) {
        console.error('Error deleting personality quiz:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa bài trắc nghiệm',
            error: error.message
        });
    }
};

export const createQuizQuestion = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { content, options, order, dimension, attribute } = req.body;

        if (!isValidObjectId(quizId)) {
            return res.status(400).json({
                success: false,
                message: 'ID bài trắc nghiệm không hợp lệ'
            });
        }

        const quiz = await PersonalityQuiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Bài trắc nghiệm không tồn tại'
            });
        }

        const validation = validateQuestionData({ 
            content, 
            options, 
            dimension, 
            attribute 
        }, quiz.type);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: validation.errors
            });
        }

        let questionOrder = order;
        if (!questionOrder) {
            const lastQuestion = await QuizQuestion.findOne({ quizId })
                .sort({ order: -1 })
                .select('order');
            questionOrder = (lastQuestion?.order || 0) + 1;
        }

        const newQuestion = new QuizQuestion({
            quizId,
            content,
            options,
            order: questionOrder,
            dimension: quiz.type === 'MBTI' ? dimension : null,
            attribute: quiz.type === 'Holland' ? attribute : null
        });

        await newQuestion.save();

        res.status(201).json({
            success: true,
            message: 'Tạo câu hỏi thành công',
            data: newQuestion
        });
    } catch (error) {
        console.error('Error creating quiz question:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo câu hỏi',
            error: error.message
        });
    }
};

export const updateQuizQuestion = async (req, res) => {
    try {
        const { quizId, questionId } = req.params;
        const { content, options, order, dimension, attribute } = req.body;

        if (!isValidObjectId(quizId) || !isValidObjectId(questionId)) {
            return res.status(400).json({
                success: false,
                message: 'ID không hợp lệ'
            });
        }

        const question = await QuizQuestion.findOne({
            _id: questionId,
            quizId
        });

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Câu hỏi không tồn tại'
            });
        }

        const quiz = await PersonalityQuiz.findById(quizId);

        if (content || options || dimension || attribute) {
            const validation = validateQuestionData({ 
                content: content || question.content, 
                options: options || question.options,
                dimension: dimension || question.dimension,
                attribute: attribute || question.attribute
            }, quiz.type);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Dữ liệu không hợp lệ',
                    errors: validation.errors
                });
            }
        }

        const updateData = {};
        if (content) updateData.content = content;
        if (options) updateData.options = options;
        if (order !== undefined) updateData.order = order;
        if (dimension !== undefined) updateData.dimension = quiz.type === 'MBTI' ? dimension : null;
        if (attribute !== undefined) updateData.attribute = quiz.type === 'Holland' ? attribute : null;

        const updatedQuestion = await QuizQuestion.findByIdAndUpdate(
            questionId,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Cập nhật câu hỏi thành công',
            data: updatedQuestion
        });
    } catch (error) {
        console.error('Error updating quiz question:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật câu hỏi',
            error: error.message
        });
    }
};

export const deleteQuizQuestion = async (req, res) => {
    try {
        const { quizId, questionId } = req.params;

        if (!isValidObjectId(quizId) || !isValidObjectId(questionId)) {
            return res.status(400).json({
                success: false,
                message: 'ID không hợp lệ'
            });
        }

        const question = await QuizQuestion.findOneAndDelete({
            _id: questionId,
            quizId
        });

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Câu hỏi không tồn tại'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa câu hỏi thành công'
        });
    } catch (error) {
        console.error('Error deleting quiz question:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa câu hỏi',
            error: error.message
        });
    }
};

export const submitPersonalityQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { answers } = req.body;
        const studentId = req.user?._id || req.headers['x-user-id'];

        if (!isValidObjectId(quizId)) {
            return res.status(400).json({
                success: false,
                message: 'ID bài trắc nghiệm không hợp lệ'
            });
        }

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: 'Chưa xác thực người dùng'
            });
        }

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: 'Câu trả lời không hợp lệ'
            });
        }

        const quiz = await PersonalityQuiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Bài trắc nghiệm không tồn tại'
            });
        }

        const questions = await QuizQuestion.find({ quizId })
            .sort({ order: 1 });

        if (questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Bài trắc nghiệm chưa có câu hỏi'
            });
        }

        if (answers.length !== questions.length) {
            return res.status(400).json({
                success: false,
                message: `Phải trả lời tất cả ${questions.length} câu hỏi`
            });
        }

        // Tính toán kết quả dựa trên loại quiz
        let resultScore, interpretation;

        if (quiz.type === 'MBTI') {
            resultScore = calculateMBTIResult(answers, questions);
            interpretation = resultScore.type; // "INTJ", "ENFP", ...
        } else if (quiz.type === 'Holland') {
            resultScore = calculateHollandResult(answers, questions);
            interpretation = resultScore.scores; // { R: 3.5, I: 4.2, ... }
        }

        const newAttempt = new QuizAttempt({
            studentId,
            quizId,
            rawAnswers: answers,
            resultScore,
            interpretation,
            attemptedAt: new Date()
        });

        await newAttempt.save();

        // Cập nhật StudentProfile
        const studentProfile = await StudentProfile.findOne({ userId: studentId });
        if (studentProfile) {
            if (quiz.type === 'MBTI') {
                studentProfile.mbtiResult = {
                    type: interpretation,
                    scores: resultScore.scores,
                    completedAt: new Date()
                };
            } else if (quiz.type === 'Holland') {
                studentProfile.hollandResult = {
                    scores: interpretation,
                    completedAt: new Date()
                };
            }
            await studentProfile.save();
        }

        res.status(201).json({
            success: true,
            message: 'Nộp bài thành công',
            data: {
                attemptId: newAttempt._id,
                resultScore,
                interpretation,
                quizType: quiz.type
            }
        });
    } catch (error) {
        console.error('Error submitting personality quiz:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi nộp bài',
            error: error.message
        });
    }
};

export const getAttemptResult = async (req, res) => {
    try {
        const { attemptId } = req.params;

        if (!isValidObjectId(attemptId)) {
            return res.status(400).json({
                success: false,
                message: 'ID attempt không hợp lệ'
            });
        }

        const attempt = await QuizAttempt.findById(attemptId)
            .populate('quizId', 'title description type')
            .populate('studentId', 'fullName email');

        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: 'Kết quả không tồn tại'
            });
        }

        res.status(200).json({
            success: true,
            data: attempt
        });
    } catch (error) {
        console.error('Error fetching attempt result:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy kết quả',
            error: error.message
        });
    }
};

export const getStudentQuizAttempts = async (req, res) => {
    try {
        const studentId = req.user?._id || req.headers['x-user-id'];

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: 'Chưa xác thực người dùng'
            });
        }

        const attempts = await QuizAttempt.find({ studentId })
            .populate('quizId', 'title type')
            .sort({ attemptedAt: -1 })
            .select('-rawAnswers')
            .lean();

        res.status(200).json({
            success: true,
            data: attempts
        });
    } catch (error) {
        console.error('Error fetching student quiz attempts:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử làm bài',
            error: error.message
        });
    }
};

export const getQuizStatistics = async (req, res) => {
    try {
        const { quizId } = req.params;

        if (!isValidObjectId(quizId)) {
            return res.status(400).json({
                success: false,
                message: 'ID bài trắc nghiệm không hợp lệ'
            });
        }

        const quiz = await PersonalityQuiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Bài trắc nghiệm không tồn tại'
            });
        }

        const attempts = await QuizAttempt.find({ quizId });
        const stats = getQuizStats(quizId, attempts);

        res.status(200).json({
            success: true,
            data: {
                quiz,
                statistics: stats
            }
        });
    } catch (error) {
        console.error('Error fetching quiz statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê',
            error: error.message
        });
    }
};

export const getPersonalityQuizByType = async (req, res) => {
    try {
        const { type } = req.params;

        if (!['MBTI', 'Holland'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Loại trắc nghiệm không hợp lệ. Chỉ chấp nhận MBTI hoặc Holland.'
            });
        }

        // Find the active quiz by type
        const quiz = await PersonalityQuiz.findOne({ 
            type: type, 
            isActive: true 
        }).lean();

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy bài trắc nghiệm loại ${type}`
            });
        }

        // Find all questions associated with this quiz ID
        const questions = await QuizQuestion.find({ quizId: quiz._id })
            .sort({ order: 1 })
            .select('-__v')
            .lean();

        // Return combined data
        res.status(200).json({
            success: true,
            data: {
                ...quiz,
                questions
            }
        });
    } catch (error) {
        console.error(`Error fetching ${req.params.type} quiz:`, error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin bài trắc nghiệm',
            error: error.message
        });
    }
};

export const importQuestionsFromExcel = async (req, res) => {
    try {
        const { quizId } = req.params;

        if (!isValidObjectId(quizId)) {
            return res.status(400).json({
                success: false,
                message: 'ID bài trắc nghiệm không hợp lệ'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng upload file Excel'
            });
        }

        const quiz = await PersonalityQuiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Bài trắc nghiệm không tồn tại'
            });
        }

        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            return res.status(400).json({
                success: false,
                message: 'File Excel không có sheet'
            });
        }

        const rows = worksheet.getSheetValues();
        if (rows.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'File Excel phải có header row'
            });
        }

        const headers = rows[1];
        if (!headers) {
            return res.status(400).json({
                success: false,
                message: 'File Excel không có headers'
            });
        }

        let questionsCreated = 0;
        let questionsSkipped = 0;
        const errors = [];

        for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[1]) continue; 

            try {
                let questionData = {
                    content: row[1]?.toString().trim(),
                    quizId
                };

                if (quiz.type === 'MBTI') {
                    questionData.dimension = row[2]?.toString().trim();
                    questionData.options = [
                        {
                            text: row[3]?.toString().trim(),
                            preference: row[4]?.toString().trim()
                        },
                        {
                            text: row[5]?.toString().trim(),
                            preference: row[6]?.toString().trim()
                        }
                    ];
                } else if (quiz.type === 'Holland') {
                    questionData.attribute = row[2]?.toString().trim();
                    questionData.options = [
                        {
                            text: row[3]?.toString().trim(),
                            score: parseInt(row[4]) || 1
                        },
                        {
                            text: row[5]?.toString().trim(),
                            score: parseInt(row[6]) || 2
                        },
                        {
                            text: row[7]?.toString().trim(),
                            score: parseInt(row[8]) || 3
                        },
                        {
                            text: row[9]?.toString().trim(),
                            score: parseInt(row[10]) || 4
                        },
                        {
                            text: row[11]?.toString().trim(),
                            score: parseInt(row[12]) || 5
                        }
                    ];
                }

                const validation = validateQuestionData(questionData, quiz.type);
                if (!validation.isValid) {
                    questionsSkipped++;
                    errors.push({
                        row: i + 1,
                        content: questionData.content,
                        errors: validation.errors
                    });
                    continue;
                }

                const lastQuestion = await QuizQuestion.findOne({ quizId })
                    .sort({ order: -1 })
                    .select('order');
                const order = (lastQuestion?.order || 0) + 1;

                const newQuestion = new QuizQuestion({
                    quizId,
                    content: questionData.content,
                    options: questionData.options,
                    order,
                    dimension: quiz.type === 'MBTI' ? questionData.dimension : null,
                    attribute: quiz.type === 'Holland' ? questionData.attribute : null
                });

                await newQuestion.save();
                questionsCreated++;
            } catch (error) {
                questionsSkipped++;
                errors.push({
                    row: i + 1,
                    error: error.message
                });
            }
        }

        res.status(201).json({
            success: true,
            message: `Import thành công ${questionsCreated} câu hỏi`,
            data: {
                questionsCreated,
                questionsSkipped,
                totalRows: rows.length - 2,
                errors: errors.length > 0 ? errors : null
            }
        });
    } catch (error) {
        console.error('Error importing questions from Excel:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi import câu hỏi từ Excel',
            error: error.message
        });
    }
};

export default {
    getAllPersonalityQuizzes,
    getPersonalityQuizById,
    createPersonalityQuiz,
    updatePersonalityQuiz,
    deletePersonalityQuiz,
    createQuizQuestion,
    updateQuizQuestion,
    deleteQuizQuestion,
    submitPersonalityQuiz,
    getAttemptResult,
    getStudentQuizAttempts,
    getQuizStatistics,
    getPersonalityQuizByType,
    importQuestionsFromExcel
};
