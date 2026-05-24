import UniversityAffiliationRepository from '../repositories/UniversityAffiliationRepository.js';
import UniversityRepository from '../repositories/UniversityRepository.js';
import {
  getUserById,
  getUsersByIds,
  updateUserStatus,
} from '../clients/authServiceClient.js';
import { getPagination } from '../utils/query.js';
import { HttpError } from '../utils/httpError.js';

const ensureManagerCanAccess = (currentUser, universityId, action = 'xử lý') => {
  if (currentUser.role === 'admin') return;
  if (!currentUser.universityId || currentUser.universityId.toString() !== universityId.toString()) {
    throw new HttpError(403, `Bạn chỉ có quyền ${action} yêu cầu của trường mình quản lý`);
  }
};

const toPlainObject = (item) => (item?.toObject ? item.toObject() : item);

const mapById = (items = []) =>
  new Map(items.map((item) => [item._id?.toString?.() || item._id, item]));

class AffiliationService {
  async getCurrentUser(userId) {
    const currentUser = await getUserById(userId);
    if (!currentUser) throw new HttpError(401, 'Người dùng không tồn tại');
    return currentUser;
  }

  async attachAuthUsers(affiliations) {
    const isList = Array.isArray(affiliations);
    const items = isList ? affiliations : [affiliations];
    const plainItems = items.map(toPlainObject);
    const userIds = [
      ...new Set(
        plainItems
          .flatMap((item) => [item.authUserId, item.reviewerId, item.reviewedBy])
          .filter(Boolean),
      ),
    ];

    const usersById = mapById(await getUsersByIds(userIds));
    const enriched = plainItems.map((item) => ({
      ...item,
      studentId: usersById.get(item.authUserId) || null,
      reviewerId: item.reviewerId ? usersById.get(item.reviewerId) || item.reviewerId : undefined,
      reviewedBy: item.reviewedBy ? usersById.get(item.reviewedBy) || item.reviewedBy : undefined,
    }));

    return isList ? enriched : enriched[0];
  }

  async list(query, requester) {
    const currentUser = await this.getCurrentUser(requester.userId);
    const { page, limit, skip } = getPagination(query, 10);
    const filter = {};
    if (query.status) filter.status = query.status;
    if (currentUser.role === 'uniManager') filter.universityId = currentUser.universityId;

    const [data, total] = await Promise.all([
      UniversityAffiliationRepository.findMany(filter, { sort: { createdAt: -1 }, skip, limit }),
      UniversityAffiliationRepository.count(filter),
    ]);

    return {
      data: await this.attachAuthUsers(data),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async stats(requester) {
    const currentUser = await this.getCurrentUser(requester.userId);
    const baseFilter = currentUser.role === 'uniManager' ? { universityId: currentUser.universityId } : {};
    const [total, pending, approved, rejected] = await Promise.all([
      UniversityAffiliationRepository.count(baseFilter),
      UniversityAffiliationRepository.count({ ...baseFilter, status: 'pending' }),
      UniversityAffiliationRepository.count({ ...baseFilter, status: 'approved' }),
      UniversityAffiliationRepository.count({ ...baseFilter, status: 'rejected' }),
    ]);
    return { total, pending, approved, rejected };
  }

  async listByUniversity(universityId, query, requester) {
    const currentUser = await this.getCurrentUser(requester.userId);
    ensureManagerCanAccess(currentUser, universityId, 'xem');

    const university = await UniversityRepository.findById(universityId);
    if (!university) throw new HttpError(404, 'Không tìm thấy trường đại học');

    const { page, limit, skip } = getPagination(query, 10);
    const filter = { universityId };
    if (query.status) filter.status = query.status;

    const [data, total] = await Promise.all([
      UniversityAffiliationRepository.findMany(filter, { sort: { createdAt: -1 }, skip, limit }),
      UniversityAffiliationRepository.count(filter),
    ]);

    return {
      data: await this.attachAuthUsers(data),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getById(id, requester) {
    const currentUser = await this.getCurrentUser(requester.userId);
    const affiliation = await UniversityAffiliationRepository.findById(id, true);
    if (!affiliation) throw new HttpError(404, 'Yêu cầu không tồn tại');
    ensureManagerCanAccess(currentUser, affiliation.universityId._id || affiliation.universityId, 'xem');
    return this.attachAuthUsers(affiliation);
  }

  async createFromAuth(payload) {
    const {
      authUserId,
      studentIdNumber,
      universityId,
      studentCardFront,
      studentCardBack,
      personalNote = '',
    } = payload;

    if (!authUserId || !universityId) {
      throw new HttpError(400, 'authUserId và universityId là bắt buộc');
    }

    const university = await UniversityRepository.findById(universityId);
    if (!university) throw new HttpError(404, 'Không tìm thấy trường đại học');

    const affiliation = await UniversityAffiliationRepository.create({
      authUserId,
      studentIdNumber,
      universityId,
      studentCardFront,
      studentCardBack,
      personalNote,
      status: 'pending',
      appliedAt: new Date(),
    });

    return this.attachAuthUsers(affiliation);
  }

  async review(id, requester, status, reviewNote = '') {
    const currentUser = await this.getCurrentUser(requester.userId);
    const affiliation = await UniversityAffiliationRepository.findById(id);
    if (!affiliation) throw new HttpError(404, 'Yêu cầu không tồn tại');
    ensureManagerCanAccess(currentUser, affiliation.universityId, status === 'approved' ? 'duyệt' : 'từ chối');
    if (affiliation.status !== 'pending') {
      throw new HttpError(400, `Không thể xử lý yêu cầu đang ở trạng thái '${affiliation.status}'`);
    }
    if (status === 'rejected' && !reviewNote?.trim()) {
      throw new HttpError(400, 'Vui lòng cung cấp lý do từ chối');
    }

    const updated = await UniversityAffiliationRepository.updateById(id, {
      status,
      reviewerId: requester.userId,
      reviewedBy: requester.userId,
      reviewNote: reviewNote || '',
      rejectionReason: status === 'rejected' ? reviewNote : '',
      reviewedAt: new Date(),
    });

    await updateUserStatus(affiliation.authUserId, status === 'approved'
      ? { status: 'active' }
      : { status: 'banned', banReleaseDate: null });

    return this.attachAuthUsers(updated);
  }
}

export default new AffiliationService();
