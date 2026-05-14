import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {
    UserRepository,
    FileRepository
} from '../repositories/index.js';
import { getRegistrationStrategy } from '../strategies/registrationStrategies.js';
import { getUniversityById } from '../clients/universityServiceClient.js';

class AuthService {
    async checkBirthday(DOB) {
        const today = new Date();
        const birthDate = new Date(DOB);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (isNaN(age) || age < 15) {
            throw {
                status: 400,
                message: 'Ngay sinh khong hop le hoac ban phai tren 15 tuoi'
            };
        }
    }

    toUserObject(user) {
        const userResponse = user.toObject ? user.toObject() : { ...user };
        delete userResponse.password;
        return userResponse;
    }

    async attachUniversityInfo(userResponse) {
        if (!['uniManager', 'uniRep'].includes(userResponse.role) || !userResponse.universityId) {
            return userResponse;
        }

        try {
            userResponse.universityId = await getUniversityById(userResponse.universityId);
        } catch (error) {
            userResponse.universityLookupError = error.message;
        }

        return userResponse;
    }

    async toPublicUser(user) {
        return this.attachUniversityInfo(this.toUserObject(user));
    }

    toInternalUser(user) {
        const userResponse = this.toUserObject(user);
        if (userResponse.universityId) {
            userResponse.universityId = userResponse.universityId.toString();
        }
        return userResponse;
    }

    async login(email, password) {
        const user = await UserRepository.findByEmailWithPassword(email);

        if (!user) {
            throw { status: 401, message: 'Email hoac mat khau khong chinh xac' };
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw { status: 401, message: 'Email hoac mat khau khong chinh xac' };
        }

        if (user.status === 'banned') {
            throw { status: 403, message: 'Tai khoan cua ban da bi khoa' };
        }

        if (user.status === 'pending') {
            throw { status: 403, message: 'Tai khoan cua ban dang cho phe duyet' };
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return {
            token,
            user: await this.toPublicUser(user)
        };
    }

    async register(userData) {
        const { email, password, firstName, lastName, role } = userData;

        const existingUser = await UserRepository.findByEmail(email);
        if (existingUser) {
            throw { status: 400, message: 'Email da duoc su dung' };
        }

        const user = await UserRepository.create({
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
            role: role || 'student',
            status: role === 'student' ? 'active' : 'pending'
        });

        return this.toPublicUser(user);
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            throw { status: 401, message: 'Token khong hop le' };
        }
    }

    async getUserById(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw { status: 404, message: 'Khong tim thay nguoi dung' };
        }
        return this.toPublicUser(user);
    }

    async updateUser(userId, updateData) {
        const user = await UserRepository.update(userId, updateData);
        if (!user) {
            throw { status: 404, message: 'Khong tim thay nguoi dung' };
        }
        return this.toPublicUser(user);
    }

    async registerUser(userData) {
        return this.registerWithStrategy('student', userData);
    }

    async registerUniversityRep(userData, files) {
        return this.registerWithStrategy('universityRepresentative', userData, files);
    }

    async registerWithStrategy(type, userData, files = {}) {
        const strategy = getRegistrationStrategy(type);
        return strategy.register({ data: userData, files });
    }

    async getUserProfile(userId) {
        const user = await UserRepository.findByIdSelectFields(
            userId,
            'fullName DOB studentId avatar address role universityId createdAt'
        );

        if (!user) {
            throw { status: 404, message: 'Nguoi dung khong ton tai' };
        }

        return this.toPublicUser(user);
    }

    async getMyProfile(userId) {
        const user = await UserRepository.findByIdWithPopulatedUniversity(userId);

        if (!user) {
            throw { status: 404, message: 'Nguoi dung khong ton tai' };
        }

        return this.toPublicUser(user);
    }

    async getInternalUserById(userId) {
        const user = await UserRepository.findByIdWithoutPassword(userId);
        if (!user) {
            throw { status: 404, message: 'Nguoi dung khong ton tai' };
        }
        return this.toInternalUser(user);
    }

    async getInternalUsersByIds(userIds) {
        const uniqueIds = [...new Set(userIds.filter(Boolean))];
        if (uniqueIds.length === 0) return [];
        const users = await UserRepository.findByIds(uniqueIds);
        return users.map((user) => this.toInternalUser(user));
    }

    async updateInternalUserStatus(userId, { status, banReleaseDate = null }) {
        if (!['active', 'pending', 'banned'].includes(status)) {
            throw { status: 400, message: 'Trang thai nguoi dung khong hop le' };
        }

        const updated = await UserRepository.updateWithoutPassword(userId, {
            status,
            banReleaseDate
        });

        if (!updated) {
            throw { status: 404, message: 'Nguoi dung khong ton tai' };
        }

        return this.toInternalUser(updated);
    }

    async updateMyProfile(userId, updateData) {
        const { fullName, DOB, address, studentId, password } = updateData;
        const user = await UserRepository.findById(userId);

        if (!user) {
            throw { status: 404, message: 'Nguoi dung khong ton tai' };
        }

        if (!['student', 'uniRep', 'uniManager'].includes(user.role)) {
            throw { status: 403, message: 'Khong co quyen chinh sua profile' };
        }

        const updatePayload = {};
        if (fullName) updatePayload.fullName = fullName.trim();
        if (DOB) updatePayload.DOB = DOB;
        if (address) updatePayload.address = address.trim();
        if (studentId) updatePayload.studentId = studentId.trim();
        if (password) updatePayload.password = password;

        const updated = await UserRepository.update(userId, updatePayload);
        return this.toPublicUser(updated);
    }

    async uploadAvatar(userId, file) {
        if (!file) {
            throw { status: 400, message: 'Vui long chon anh' };
        }

        const user = await UserRepository.findById(userId);
        if (!user) {
            throw { status: 404, message: 'Nguoi dung khong ton tai' };
        }

        const bucketCheck = await FileRepository.ensureBucketExists('user-avatars');
        if (!bucketCheck.success) {
            throw { status: 500, message: `Loi kiem tra bucket: ${bucketCheck.error}` };
        }

        if (user.avatar) {
            try {
                const fileKey = FileRepository.extractFileNameFromUrl(user.avatar);
                await FileRepository.deleteAvatar(fileKey);
            } catch (error) {
                console.error('Error deleting old avatar:', error);
            }
        }

        const avatarResult = await FileRepository.uploadAvatar(file);
        if (!avatarResult.success) {
            throw { status: 500, message: `Loi upload avatar: ${avatarResult.error}` };
        }

        const updated = await UserRepository.updateAvatar(userId, avatarResult.url);
        return this.toPublicUser(updated);
    }

    async deleteAvatar(userId) {
        const user = await UserRepository.findById(userId);

        if (!user) {
            throw { status: 404, message: 'Nguoi dung khong ton tai' };
        }

        if (user.avatar) {
            try {
                const fileKey = FileRepository.extractFileNameFromUrl(user.avatar);
                await FileRepository.deleteAvatar(fileKey);
            } catch (error) {
                console.error('Error deleting avatar:', error);
            }

            await UserRepository.deleteAvatar(userId);
        }

        return { success: true };
    }
}

export default new AuthService();
