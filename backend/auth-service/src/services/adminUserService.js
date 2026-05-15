import { UserRepository } from '../repositories/index.js';
import { getUniversityById } from '../clients/universityServiceClient.js';

const VALID_ROLES = ['admin', 'uniManager', 'uniRep', 'student'];
const VALID_STATUSES = ['active', 'pending', 'banned'];

const normalizeRole = (role = 'student') => (role === 'user' ? 'student' : role);
const isUniversityRole = (role) => ['uniManager', 'uniRep'].includes(role);

const toUserObject = (user) => {
    const data = user?.toObject ? user.toObject() : { ...user };
    delete data.password;
    return data;
};

const requireValidRole = (role) => {
    if (!VALID_ROLES.includes(role)) {
        throw { status: 400, message: 'Vai tro khong hop le' };
    }
};

const requireValidStatus = (status) => {
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
        throw { status: 400, message: 'Trang thai nguoi dung khong hop le' };
    }
};

class AdminUserService {
    buildFilter(query = {}) {
        const filter = {};

        if (query.includeAdmins !== 'true') {
            filter.role = { $ne: 'admin' };
        }

        if (query.role) {
            const role = normalizeRole(query.role);
            requireValidRole(role);
            filter.role = role;
        }

        if (query.status) {
            requireValidStatus(query.status);
            filter.status = query.status;
        }

        if (query.search) {
            Object.assign(filter, UserRepository.buildSearchFilter(query.search));
        }

        return filter;
    }

    async attachUniversity(user) {
        const data = toUserObject(user);
        if (!isUniversityRole(data.role) || !data.universityId) return data;

        try {
            data.universityId = await getUniversityById(data.universityId);
        } catch (error) {
            data.universityLookupError = error.message;
        }

        return data;
    }

    async listUsers(query = {}) {
        const { getPagination, getSort } = await import('../utils/query.js');
        const filter = this.buildFilter(query);
        const { page, limit, skip } = getPagination(query, 20);
        const sort = getSort(query, '-createdAt');

        const [users, total] = await Promise.all([
            UserRepository.listUsers({ filter, sort, skip, limit }),
            UserRepository.count(filter)
        ]);

        const data = await Promise.all(users.map((user) => this.attachUniversity(user)));

        return {
            data,
            users: data,
            count: data.length,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) }
        };
    }

    async getUserById(id) {
        const user = await UserRepository.findByIdWithoutPassword(id);
        if (!user) throw { status: 404, message: 'Nguoi dung khong ton tai' };
        return this.attachUniversity(user);
    }

    async validateUniversityAssignment(role, universityId, excludeUserId = null) {
        if (!isUniversityRole(role)) return null;

        if (!universityId) {
            throw { status: 400, message: 'Vai tro uniRep hoac uniManager phai co universityId' };
        }

        await getUniversityById(universityId);

        if (role === 'uniManager') {
            const existingManager = await UserRepository.findManagerByUniversity(universityId, excludeUserId);
            if (existingManager) {
                throw {
                    status: 409,
                    message: 'Truong nay da co uniManager. Moi truong chi co mot quan ly.'
                };
            }
        }

        return universityId;
    }

    async createUser(payload = {}) {
        const role = normalizeRole(payload.role);
        requireValidRole(role);

        const fullName = payload.fullName?.trim();
        const email = payload.email?.trim()?.toLowerCase();
        const password = payload.password;

        if (!fullName || !email || !password) {
            throw { status: 400, message: 'fullName, email va password la bat buoc' };
        }

        if (password.length < 6) {
            throw { status: 400, message: 'Mat khau phai co it nhat 6 ky tu' };
        }

        const existing = await UserRepository.findByEmail(email);
        if (existing) throw { status: 409, message: 'Email da duoc su dung' };

        const universityId = await this.validateUniversityAssignment(role, payload.universityId);
        const status = payload.status || 'active';
        requireValidStatus(status);

        const user = await UserRepository.create({
            fullName,
            email,
            password,
            role,
            status,
            universityId: isUniversityRole(role) ? universityId : undefined,
            DOB: payload.DOB ? new Date(payload.DOB) : undefined,
            address: payload.address?.trim() || '',
            phone: payload.phone?.trim() || '',
            studentId: payload.studentId?.trim() || undefined
        });

        return this.attachUniversity(user);
    }

    async updateUser(id, payload = {}) {
        const existing = await UserRepository.findById(id);
        if (!existing) throw { status: 404, message: 'Nguoi dung khong ton tai' };

        const nextRole = payload.role !== undefined ? normalizeRole(payload.role) : existing.role;
        requireValidRole(nextRole);
        requireValidStatus(payload.status);

        const nextUniversityId = isUniversityRole(nextRole)
            ? (payload.universityId || existing.universityId)
            : undefined;

        await this.validateUniversityAssignment(nextRole, nextUniversityId, id);

        const updateData = {};
        if (payload.fullName !== undefined) updateData.fullName = payload.fullName?.trim();
        if (payload.email !== undefined) {
            const email = payload.email?.trim()?.toLowerCase();
            if (!email) throw { status: 400, message: 'Email khong duoc de trong' };

            const duplicate = await UserRepository.findByEmail(email);
            if (duplicate && String(duplicate._id) !== String(id)) {
                throw { status: 409, message: 'Email da duoc su dung' };
            }
            updateData.email = email;
        }
        if (payload.password) updateData.password = payload.password;
        if (payload.role !== undefined) updateData.role = nextRole;
        if (payload.status !== undefined) updateData.status = payload.status;
        if (payload.DOB !== undefined) updateData.DOB = payload.DOB ? new Date(payload.DOB) : null;
        if (payload.address !== undefined) updateData.address = payload.address?.trim() || '';
        if (payload.phone !== undefined) updateData.phone = payload.phone?.trim() || '';
        if (payload.studentId !== undefined) updateData.studentId = payload.studentId?.trim() || undefined;
        updateData.universityId = isUniversityRole(nextRole) ? nextUniversityId : null;

        const user = await UserRepository.update(id, updateData);
        return this.attachUniversity(user);
    }

    async unbanUser(id) {
        const user = await UserRepository.updateWithoutPassword(id, {
            status: 'active',
            banReleaseDate: null
        });

        if (!user) throw { status: 404, message: 'Nguoi dung khong ton tai' };
        return this.attachUniversity(user);
    }

    async getInternalStats() {
        const [totalUsers, totalUniReps] = await Promise.all([
            UserRepository.countNonAdmin(),
            UserRepository.countUniversityRepresentatives()
        ]);

        return { totalUsers, totalUniReps };
    }
}

export default new AdminUserService();
