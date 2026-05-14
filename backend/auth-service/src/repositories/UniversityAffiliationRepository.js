import UniversityAffiliation from '../models/UniversityAffiliation.js';

class UniversityAffiliationRepository {
    /**
     * Tìm affiliation theo ID
     */
    async findById(affiliationId) {
        return await UniversityAffiliation.findById(affiliationId);
    }

    /**
     * Tìm affiliation theo student ID
     */
    async findByStudentId(studentId) {
        return await UniversityAffiliation.find({ studentId });
    }

    /**
     * Tìm affiliation theo university ID
     */
    async findByUniversityId(universityId) {
        return await UniversityAffiliation.find({ universityId });
    }

    /**
     * Tìm affiliation theo student ID và university ID
     */
    async findByStudentAndUniversity(studentId, universityId) {
        return await UniversityAffiliation.findOne({ studentId, universityId });
    }

    /**
     * Tìm tất cả affiliations
     */
    async findAll() {
        return await UniversityAffiliation.find();
    }

    /**
     * Tìm affiliations theo status
     */
    async findByStatus(status) {
        return await UniversityAffiliation.find({ status });
    }

    /**
     * Tạo affiliation mới
     */
    async create(affiliationData) {
        const affiliation = new UniversityAffiliation(affiliationData);
        return await affiliation.save();
    }

    /**
     * Cập nhật affiliation
     */
    async update(affiliationId, updateData) {
        return await UniversityAffiliation.findByIdAndUpdate(
            affiliationId,
            { ...updateData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );
    }

    /**
     * Xóa affiliation
     */
    async delete(affiliationId) {
        return await UniversityAffiliation.findByIdAndDelete(affiliationId);
    }

    /**
     * Kiểm tra affiliation tồn tại
     */
    async exists(affiliationId) {
        const affiliation = await UniversityAffiliation.findById(affiliationId);
        return !!affiliation;
    }

    /**
     * Cập nhật status affiliation
     */
    async updateStatus(affiliationId, status, reviewedBy = null, rejectionReason = null) {
        const updateData = {
            status,
            reviewedAt: Date.now(),
            updatedAt: Date.now()
        };

        if (reviewedBy) {
            updateData.reviewedBy = reviewedBy;
        }

        if (rejectionReason) {
            updateData.rejectionReason = rejectionReason;
        }

        return await UniversityAffiliation.findByIdAndUpdate(
            affiliationId,
            updateData,
            { new: true }
        );
    }

    /**
     * Phê duyệt affiliation
     */
    async approve(affiliationId, reviewedBy) {
        return await this.updateStatus(affiliationId, 'approved', reviewedBy);
    }

    /**
     * Từ chối affiliation
     */
    async reject(affiliationId, reviewedBy, rejectionReason) {
        return await this.updateStatus(affiliationId, 'rejected', reviewedBy, rejectionReason);
    }

    /**
     * Lấy affiliations pending
     */
    async findPendingAffiliations() {
        return await UniversityAffiliation.find({ status: 'pending' })
            .populate('studentId', 'fullName email studentId')
            .populate('universityId', 'name');
    }

    /**
     * Lấy affiliations pending theo university
     */
    async findPendingByUniversity(universityId) {
        return await UniversityAffiliation.find({ universityId, status: 'pending' })
            .populate('studentId', 'fullName email studentId');
    }

    /**
     * Phân trang affiliations
     */
    async findPaginated(page = 1, limit = 10, filter = {}) {
        const skip = (page - 1) * limit;
        const affiliations = await UniversityAffiliation.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ appliedAt: -1 })
            .populate('studentId', 'fullName email studentId')
            .populate('universityId', 'name');
        
        const total = await UniversityAffiliation.countDocuments(filter);
        
        return {
            affiliations,
            total,
            page,
            pages: Math.ceil(total / limit)
        };
    }

    /**
     * Lấy lịch sử affiliations của user
     */
    async findUserAffiliationHistory(studentId) {
        return await UniversityAffiliation.find({ studentId })
            .sort({ appliedAt: -1 })
            .populate('universityId', 'name logo');
    }
}

export default new UniversityAffiliationRepository();
