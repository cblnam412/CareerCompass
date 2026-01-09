import StudentSubjectScore from '../models/StudentSubjectScore.js';
import Subject from '../models/Subject.js';
import ExamResult from '../models/ExamResult.js';

export const getStudentAllSubjectScores = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { search } = req.query;

        const allSubjects = await Subject.find().sort({ name: 1 });
        const studentScores = await StudentSubjectScore.find({ studentId })
            .populate('subjectId', 'name')
            .lean();

        const scoreMap = {};
        studentScores.forEach(score => {
            scoreMap[score.subjectId._id.toString()] = score;
        });
        let results = allSubjects.map(subject => {
            const subjectScore = scoreMap[subject._id.toString()] || {
                studentId,
                subjectId: subject._id,
                score: 0,
                examCount: 0,
                totalScore: 0
            };
            return {
                _id: subjectScore._id,
                subjectId: subject._id,
                subjectName: subject.name,
                score: subjectScore.score || 0,
                examCount: subjectScore.examCount || 0,
                totalScore: subjectScore.totalScore || 0,
                updatedAt: subjectScore.updatedAt
            };
        });

        if (search) {
            results = results.filter(r => 
                r.subjectName.toLowerCase().includes(search.toLowerCase())
            );
        }

        res.status(200).json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Get student all subject scores error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy điểm môn học của học sinh',
            error: error.message
        });
    }
};

export const getStudentSubjectScore = async (req, res) => {
    try {
        const { studentId, subjectId } = req.params;

        let score = await StudentSubjectScore.findOne({ studentId, subjectId })
            .populate('subjectId', 'name')
            .populate('studentId', 'fullName email');

        if (!score) {
            const subject = await Subject.findById(subjectId);
            if (!subject) {
                return res.status(404).json({
                    success: false,
                    message: 'Môn học không tồn tại'
                });
            }
            score = {
                studentId,
                subjectId,
                subjectName: subject.name,
                score: 0,
                examCount: 0,
                totalScore: 0
            };
        }

        res.status(200).json({
            success: true,
            data: score
        });

    } catch (error) {
        console.error('Get student subject score error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy điểm môn học',
            error: error.message
        });
    }
};

export const updateScoreAfterExam = async (studentId, subjectId, score) => {
    try {
        let subjectScore = await StudentSubjectScore.findOne({ studentId, subjectId });

        if (!subjectScore) {
            subjectScore = new StudentSubjectScore({
                studentId,
                subjectId,
                score,
                examCount: 1,
                totalScore: score
            });
        } else {
            subjectScore.examCount += 1;
            subjectScore.totalScore += score;
            subjectScore.score = Math.round(subjectScore.totalScore / subjectScore.examCount);
        }

        await subjectScore.save();
        return subjectScore;

    } catch (error) {
        console.error('Update score after exam error:', error);
        throw error;
    }
};

export const recalculateStudentScores = async (studentId) => {
    try {
        const examResults = await ExamResult.find({ studentId }).lean();

        const scoreBySubject = {};
        examResults.forEach(result => {
            const subjectId = result.subject.toString();
            if (!scoreBySubject[subjectId]) {
                scoreBySubject[subjectId] = {
                    scores: [],
                    count: 0
                };
            }
            scoreBySubject[subjectId].scores.push(result.scoreTotal);
            scoreBySubject[subjectId].count += 1;
        });

        for (const subjectId in scoreBySubject) {
            const { scores, count } = scoreBySubject[subjectId];
            const avgScore = Math.round(
                scores.reduce((a, b) => a + b, 0) / count
            );

            await StudentSubjectScore.findOneAndUpdate(
                { studentId, subjectId },
                {
                    score: avgScore,
                    examCount: count,
                    totalScore: scores.reduce((a, b) => a + b, 0)
                },
                { upsert: true }
            );
        }

        return true;

    } catch (error) {
        console.error('Recalculate student scores error:', error);
        throw error;
    }
};

export const addOrUpdateStudentScore = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subjectId, score } = req.body;
        const userId = req.userId;

        if (userId.toString() !== studentId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền cập nhật điểm của học sinh khác'
            });
        }

        if (!subjectId || score === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp subjectId và score'
            });
        }

        if (typeof score !== 'number' || score < 0 || score > 100) {
            return res.status(400).json({
                success: false,
                message: 'Điểm phải là số từ 0 đến 100'
            });
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Môn học không tồn tại'
            });
        }

        let studentScore = await StudentSubjectScore.findOne({ studentId, subjectId });

        if (!studentScore) {
            studentScore = new StudentSubjectScore({
                studentId,
                subjectId,
                score,
                examCount: 1,
                totalScore: score
            });
        } else {
            studentScore.examCount += 1;
            studentScore.totalScore += score;
            studentScore.score = Math.round(studentScore.totalScore / studentScore.examCount);
        }

        await studentScore.save();

        const populatedScore = await StudentSubjectScore.findById(studentScore._id)
            .populate('subjectId', 'name');

        res.status(200).json({
            success: true,
            message: 'Thêm/cập nhật điểm thành công',
            data: {
                subjectName: populatedScore.subjectId.name,
                score: populatedScore.score,
                examCount: populatedScore.examCount,
                totalScore: populatedScore.totalScore
            }
        });

    } catch (error) {
        console.error('Add or update student score error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi thêm/cập nhật điểm',
            error: error.message
        });
    }
};

export const deleteStudentSubjectScore = async (req, res) => {
    try {
        const { studentId, subjectId } = req.params;
        const userId = req.userId;

        if (userId.toString() !== studentId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa điểm của học sinh khác'
            });
        }

        const score = await StudentSubjectScore.findOne({ studentId, subjectId });
        if (!score) {
            return res.status(404).json({
                success: false,
                message: 'Điểm môn học này không tồn tại'
            });
        }

        await StudentSubjectScore.deleteOne({ studentId, subjectId });

        res.status(200).json({
            success: true,
            message: 'Xóa điểm thành công'
        });

    } catch (error) {
        console.error('Delete student subject score error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xóa điểm',
            error: error.message
        });
    }
};
