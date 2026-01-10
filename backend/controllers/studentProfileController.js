import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';

export const getMyStudentProfile = async (req, res) => {
    try {
        const userId = req.userId;

        const studentProfile = await StudentProfile.findOne({ userId })
            .populate('softSkills')
            .populate('targetUniversityIds')
            .populate('academicTranscript.subjectId');

        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hồ sơ sinh viên'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy hồ sơ sinh viên thành công',
            data: studentProfile
        });

    } catch (error) {
        console.error('Get student profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy hồ sơ sinh viên',
            error: error.message
        });
    }
};

export const updateStudentProfile = async (req, res) => {
    try {
        const currentUserId = req.userId;
        const currentUserRole = req.userRole;
        const targetUserId = req.body.userId; 

        const userId = targetUserId || currentUserId;

        if (currentUserRole !== 'admin' && currentUserId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền cập nhật hồ sơ này'
            });
        }

        const { 
            province, 
            gpa, 
            currentGradeLevel, 
            academicTranscript, 
            mbtiResult, 
            hollandResult, 
            softSkills, 
            targetUniversityIds 
        } = req.body;

        if (gpa !== undefined && (gpa < 0 || gpa > 10)) {
            return res.status(400).json({
                success: false,
                message: 'GPA phải nằm trong khoảng 0-10'
            });
        }

        if (softSkills !== undefined && !Array.isArray(softSkills)) {
            return res.status(400).json({
                success: false,
                message: 'Kỹ năng mềm phải là một mảng'
            });
        }

        if (academicTranscript !== undefined && !Array.isArray(academicTranscript)) {
            return res.status(400).json({
                success: false,
                message: 'Bảng điểm phải là một mảng các môn học'
            });
        }

        if (academicTranscript !== undefined && Array.isArray(academicTranscript)) {
            for (const item of academicTranscript) {
                if (!item.subjectId || item.score === undefined) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mỗi môn học phải có subjectId và score'
                    });
                }
                if (item.score < 0 || item.score > 10) {
                    return res.status(400).json({
                        success: false,
                        message: 'Điểm môn học phải nằm trong khoảng 0-10'
                    });
                }
            }
        }

        if (targetUniversityIds !== undefined && !Array.isArray(targetUniversityIds)) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách trường đại học phải là một mảng'
            });
        }

        const updateData = {};
        if (province !== undefined) updateData.province = province;
        if (gpa !== undefined) updateData.gpa = gpa;
        if (currentGradeLevel !== undefined) updateData.currentGradeLevel = currentGradeLevel;
        if (academicTranscript !== undefined) updateData.academicTranscript = academicTranscript;
        if (mbtiResult !== undefined) updateData.mbtiResult = mbtiResult;
        if (hollandResult !== undefined) updateData.hollandResult = hollandResult;
        if (softSkills !== undefined) updateData.softSkills = softSkills;
        if (targetUniversityIds !== undefined) updateData.targetUniversityIds = targetUniversityIds;

        const studentProfile = await StudentProfile.findOneAndUpdate(
            { userId },
            updateData,
            { new: true }
        ).populate('softSkills')
         .populate('targetUniversityIds')
         .populate('academicTranscript.subjectId');

        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hồ sơ sinh viên'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật hồ sơ sinh viên thành công',
            data: studentProfile
        });

    } catch (error) {
        console.error('Update student profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật hồ sơ sinh viên',
            error: error.message
        });
    }
};
