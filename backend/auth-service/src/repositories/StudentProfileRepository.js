import StudentProfile from '../models/StudentProfile.js';

class StudentProfileRepository {
    /**
     * Tìm profile theo ID
     */
    async findById(profileId) {
        return await StudentProfile.findById(profileId);
    }

    /**
     * Tìm profile theo userId
     */
    async findByUserId(userId) {
        return await StudentProfile.findOne({ userId });
    }

    /**
     * Tạo profile mới
     */
    async create(profileData) {
        const profile = new StudentProfile(profileData);
        return await profile.save();
    }

    /**
     * Cập nhật profile
     */
    async update(profileId, updateData) {
        return await StudentProfile.findByIdAndUpdate(
            profileId,
            { ...updateData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );
    }

    /**
     * Cập nhật profile theo userId
     */
    async updateByUserId(userId, updateData) {
        return await StudentProfile.findOneAndUpdate(
            { userId },
            { ...updateData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );
    }

    /**
     * Xóa profile
     */
    async delete(profileId) {
        return await StudentProfile.findByIdAndDelete(profileId);
    }

    /**
     * Xóa profile theo userId
     */
    async deleteByUserId(userId) {
        return await StudentProfile.findOneAndDelete({ userId });
    }

    /**
     * Kiểm tra profile tồn tại
     */
    async exists(profileId) {
        const profile = await StudentProfile.findById(profileId);
        return !!profile;
    }

    /**
     * Kiểm tra profile tồn tại theo userId
     */
    async existsByUserId(userId) {
        const profile = await StudentProfile.findOne({ userId });
        return !!profile;
    }

    /**
     * Cập nhật mục tiêu trường đại học
     */
    async updateTargetUniversities(profileId, universityIds) {
        return await StudentProfile.findByIdAndUpdate(
            profileId,
            { 
                targetUniversityIds: universityIds,
                updatedAt: Date.now()
            },
            { new: true }
        );
    }

    /**
     * Cập nhật kết quả MBTI
     */
    async updateMBTIResult(profileId, mbtiResult) {
        return await StudentProfile.findByIdAndUpdate(
            profileId,
            { 
                mbtiResult,
                updatedAt: Date.now()
            },
            { new: true }
        );
    }

    /**
     * Cập nhật kết quả Holland
     */
    async updateHollandResult(profileId, hollandResult) {
        return await StudentProfile.findByIdAndUpdate(
            profileId,
            { 
                hollandResult,
                updatedAt: Date.now()
            },
            { new: true }
        );
    }

    /**
     * Cập nhật soft skills
     */
    async updateSoftSkills(profileId, softSkills) {
        return await StudentProfile.findByIdAndUpdate(
            profileId,
            { 
                softSkills,
                updatedAt: Date.now()
            },
            { new: true }
        );
    }

    /**
     * Cập nhật GPA
     */
    async updateGPA(profileId, gpa) {
        return await StudentProfile.findByIdAndUpdate(
            profileId,
            { 
                gpa,
                updatedAt: Date.now()
            },
            { new: true }
        );
    }

    /**
     * Cập nhật transcript
     */
    async updateAcademicTranscript(profileId, transcript) {
        return await StudentProfile.findByIdAndUpdate(
            profileId,
            { 
                academicTranscript: transcript,
                updatedAt: Date.now()
            },
            { new: true }
        );
    }
}

export default new StudentProfileRepository();
