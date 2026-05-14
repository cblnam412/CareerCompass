import University from '../models/University.js';

class UniversityRepository {
    /**
     * Tìm university theo ID
     */
    async findById(universityId) {
        return await University.findById(universityId);
    }

    /**
     * Tìm university theo tên
     */
    async findByName(name) {
        return await University.findOne({ name });
    }

    /**
     * Tìm tất cả universities
     */
    async findAll() {
        return await University.find();
    }

    /**
     * Tìm universities theo status
     */
    async findByStatus(status) {
        return await University.find({ status });
    }

    /**
     * Tạo university mới
     */
    async create(universityData) {
        const university = new University(universityData);
        return await university.save();
    }

    /**
     * Cập nhật university
     */
    async update(universityId, updateData) {
        return await University.findByIdAndUpdate(
            universityId,
            { ...updateData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );
    }

    /**
     * Xóa university
     */
    async delete(universityId) {
        return await University.findByIdAndDelete(universityId);
    }

    /**
     * Kiểm tra university tồn tại
     */
    async exists(universityId) {
        const university = await University.findById(universityId);
        return !!university;
    }

    /**
     * Kiểm tra tên university đã tồn tại
     */
    async nameExists(name, excludeId = null) {
        let query = { name };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        const university = await University.findOne(query);
        return !!university;
    }

    /**
     * Cập nhật logo
     */
    async updateLogo(universityId, logoUrl) {
        return await University.findByIdAndUpdate(
            universityId,
            { logo: logoUrl, updatedAt: Date.now() },
            { new: true }
        );
    }

    /**
     * Cập nhật status
     */
    async updateStatus(universityId, status) {
        return await University.findByIdAndUpdate(
            universityId,
            { status, updatedAt: Date.now() },
            { new: true }
        );
    }

    /**
     * Lấy danh sách universities active
     */
    async findActiveUniversities() {
        return await University.find({ status: 'active' });
    }

    /**
     * Phân trang universities
     */
    async findPaginated(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const universities = await University.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        
        const total = await University.countDocuments();
        
        return {
            universities,
            total,
            page,
            pages: Math.ceil(total / limit)
        };
    }
}

export default new UniversityRepository();
