import User from '../models/User.js';
import bcrypt from 'bcrypt';
import { escapeRegex } from '../utils/query.js';

class UserRepository {
    /**
     * Tìm user theo email
     */
    async findByEmail(email) {
        return await User.findOne({ email: email.toLowerCase() });
    }

    /**
     * Tìm user theo email và include password
     */
    async findByEmailWithPassword(email) {
        return await User.findOne({ email: email.toLowerCase() }).select('+password');
    }

    /**
     * Tìm user theo ID
     */
    async findById(userId) {
        return await User.findById(userId);
    }

    async findByIds(userIds) {
        return await User.find({ _id: { $in: userIds } }).select('-password');
    }

    /**
     * Tìm user theo ID và loại bỏ password
     */
    async findByIdWithoutPassword(userId) {
        return await User.findById(userId).select('-password');
    }

    /**
     * Tìm user theo ID với populate universityId
     */
    async findByIdWithUniversity(userId) {
        return await User.findById(userId);
    }

    /**
     * Tìm user theo ID và chỉ lấy các trường cần thiết
     */
    async findByIdSelectFields(userId, fields) {
        return await User.findById(userId).select(fields);
    }

    /**
     * Tìm user theo student ID
     */
    async findByStudentId(studentId) {
        return await User.findOne({ studentId: studentId.trim() });
    }

    /**
     * Tạo user mới
     */
    async create(userData) {
        const user = new User(userData);
        return await user.save();
    }

    /**
     * Cập nhật user
     */
    async update(userId, updateData) {
        const { password, ...otherData } = updateData;
        
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            otherData.password = hashedPassword;
        }

        return await User.findByIdAndUpdate(
            userId,
            { ...otherData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );
    }

    /**
     * Cập nhật user không lấy password
     */
    async updateWithoutPassword(userId, updateData) {
        return await User.findByIdAndUpdate(
            userId,
            { ...updateData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        ).select('-password');
    }

    /**
     * Xóa user
     */
    async delete(userId) {
        return await User.findByIdAndDelete(userId);
    }

    /**
     * Kiểm tra email đã tồn tại
     */
    async emailExists(email) {
        const user = await User.findOne({ email: email.toLowerCase() });
        return !!user;
    }

    /**
     * Kiểm tra student ID đã tồn tại
     */
    async studentIdExists(studentId) {
        const user = await User.findOne({ studentId: studentId.trim() });
        return !!user;
    }

    /**
     * Lấy danh sách users theo role
     */
    async findByRole(role) {
        return await User.find({ role }).select('-password');
    }

    /**
     * Lấy danh sách users theo status
     */
    async findByStatus(status) {
        return await User.find({ status }).select('-password');
    }

    async listUsers({ filter = {}, sort = '-createdAt', skip = 0, limit = 20 } = {}) {
        return await User.find(filter)
            .select('-password')
            .sort(sort)
            .skip(skip)
            .limit(limit);
    }

    async count(filter = {}) {
        return await User.countDocuments(filter);
    }

    buildSearchFilter(search) {
        if (!search) return {};
        const regex = { $regex: escapeRegex(search), $options: 'i' };
        return {
            $or: [
                { fullName: regex },
                { email: regex },
                { phone: regex },
                { studentId: regex }
            ]
        };
    }

    async findManagerByUniversity(universityId, excludeId = null) {
        const query = {
            role: 'uniManager',
            universityId
        };
        if (excludeId) query._id = { $ne: excludeId };
        return await User.findOne(query).select('-password');
    }

    async countNonAdmin() {
        return await User.countDocuments({ role: { $ne: 'admin' } });
    }

    async countUniversityRepresentatives() {
        return await User.countDocuments({ role: { $in: ['uniRep', 'uniManager'] } });
    }

    /**
     * Cập nhật avatar
     */
    async updateAvatar(userId, avatarUrl) {
        return await User.findByIdAndUpdate(
            userId,
            { avatar: avatarUrl, updatedAt: Date.now() },
            { new: true }
        ).select('-password');
    }

    /**
     * Xóa avatar
     */
    async deleteAvatar(userId) {
        return await User.findByIdAndUpdate(
            userId,
            { avatar: null, updatedAt: Date.now() },
            { new: true }
        ).select('-password');
    }

    /**
     * Lấy user với populate university
     */
    async findByIdWithPopulatedUniversity(userId) {
        return await User.findById(userId).select('-password');
    }
}

export default new UserRepository();
