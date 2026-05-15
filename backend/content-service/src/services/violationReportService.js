import { getUserById, updateUserStatus } from '../clients/authServiceClient.js';
import {
  ForumCommentRepository,
  ForumPostRepository,
  ViolationReportRepository,
} from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';
import { getPagination, toPlain } from '../utils/query.js';
import { attachUsers } from './lookupService.js';
import forumCommentService from './forumCommentService.js';
import forumPostService from './forumPostService.js';

const normalizeStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    rejected: 'Rejected',
    dismissed: 'Rejected',
    approved: 'Approved',
    resolved: 'Resolved',
  };
  return statusMap[String(status || '').toLowerCase()] || status;
};

const normalizeTargetType = (targetType) => {
  if (String(targetType).toLowerCase() === 'post') return 'Post';
  if (String(targetType).toLowerCase() === 'comment') return 'Comment';
  return targetType;
};

const normalizeReportForFrontend = (report) => {
  const data = toPlain(report);
  const reporter = data.reporterId && typeof data.reporterId === 'object' ? data.reporterId : null;
  const target = data.targetId && typeof data.targetId === 'object' ? data.targetId : null;

  return {
    _id: data._id,
    reported_item_type: data.targetType?.toLowerCase(),
    reported_item_id: data.targetItemId,
    reporter_id: {
      _id: reporter?._id || data.reporterId,
      full_name: reporter?.fullName || 'Unknown',
      email: reporter?.email,
      avatar: reporter?.avatar,
    },
    target_id: target || data.targetId,
    content: data.reason,
    status: data.status?.toLowerCase() === 'resolved'
      ? String(data.decision || '').toLowerCase()
      : data.status?.toLowerCase(),
    created_at: data.createdAt,
    processing_action: data.actionTaken || '',
  };
};

const calculateBanPayload = (violationCount) => {
  if (violationCount >= 3) return { status: 'banned', banReleaseDate: null };

  const days = violationCount === 1 ? 7 : 30;
  const banReleaseDate = new Date();
  banReleaseDate.setDate(banReleaseDate.getDate() + days);
  return { status: 'banned', banReleaseDate };
};

class ViolationReportService {
  assertAdmin(requester) {
    if (requester.role !== 'admin') {
      throw new HttpError(403, 'Chi admin co quyen xu ly bao cao');
    }
  }

  async getTarget(targetType, targetItemId) {
    const normalizedType = normalizeTargetType(targetType);
    if (!['Post', 'Comment'].includes(normalizedType)) {
      throw new HttpError(400, 'targetType phai la Post hoac Comment');
    }

    const target = normalizedType === 'Post'
      ? await ForumPostRepository.findById(targetItemId)
      : await ForumCommentRepository.findById(targetItemId);

    if (!target) {
      throw new HttpError(404, normalizedType === 'Post' ? 'Bai viet khong ton tai' : 'Binh luan khong ton tai');
    }

    return { targetType: normalizedType, target };
  }

  async createReport(reporterId, payload = {}) {
    const targetItemId = payload.targetItemId;
    const reason = payload.reason?.trim();
    const { targetType, target } = await this.getTarget(payload.targetType, targetItemId);
    const targetId = payload.targetId || payload.targerId || target.authorId;

    if (!targetId || !targetItemId || !reason) {
      throw new HttpError(400, 'Thieu thong tin: targetId, targetType, targetItemId, reason');
    }
    if (String(reporterId) === String(targetId)) {
      throw new HttpError(400, 'Khong the tu bao cao chinh minh');
    }
    if (String(target.authorId) !== String(targetId)) {
      throw new HttpError(400, 'targetId khong khop voi tac gia noi dung bi bao cao');
    }

    await Promise.all([getUserById(reporterId), getUserById(targetId)]);

    const existing = await ViolationReportRepository.findOne({
      reporterId,
      targetItemId,
      status: 'Pending',
    });
    if (existing) throw new HttpError(409, 'Ban da bao cao noi dung nay roi');

    return ViolationReportRepository.create({
      reporterId,
      targetId,
      targetType,
      targetItemId,
      reason,
    });
  }

  async getMyReports(reporterId) {
    const reports = await ViolationReportRepository.findMany(
      { reporterId },
      { sort: '-createdAt' },
    );
    return attachUsers(reports, 'targetId');
  }

  async getReports(requester, query = {}) {
    this.assertAdmin(requester);
    const filter = {};
    if (query.status && query.status !== 'all') filter.status = normalizeStatus(query.status);
    if (query.targetType) filter.targetType = normalizeTargetType(query.targetType);

    const { page, limit, skip } = getPagination(query, 10);
    const [reports, total] = await Promise.all([
      ViolationReportRepository.findMany(filter, { sort: '-createdAt', skip, limit }),
      ViolationReportRepository.count(filter),
    ]);

    const withReporters = await attachUsers(reports, 'reporterId');
    const withTargets = await attachUsers(withReporters, 'targetId');
    const normalized = withTargets.map(normalizeReportForFrontend);

    return {
      reports: normalized,
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    };
  }

  async getReportDetail(requester, reportId) {
    this.assertAdmin(requester);
    const report = await ViolationReportRepository.findById(reportId);
    if (!report) throw new HttpError(404, 'Bao cao khong ton tai');

    let targetContent = null;
    if (report.targetType === 'Post') {
      const post = await ForumPostRepository.findById(report.targetItemId);
      targetContent = post ? { title: post.title, content: post.content } : null;
    } else {
      const comment = await ForumCommentRepository.findById(report.targetItemId);
      targetContent = comment ? { content: comment.content } : null;
    }

    const [withReporter] = await attachUsers([report], 'reporterId');
    const [withTarget] = await attachUsers([withReporter], 'targetId');
    return { report: withTarget, targetContent };
  }

  async removeReportedContent(report) {
    try {
      if (report.targetType === 'Post') {
        await forumPostService.delete(report.targetItemId, null, { bypassOwner: true });
        return 'Da xoa bai viet';
      }

      const result = await forumCommentService.delete(report.targetItemId, null, { bypassOwner: true });
      return result.deletedCount > 0 ? 'Da xoa binh luan' : 'Binh luan da bi xoa truoc do';
    } catch (error) {
      if (error.statusCode === 404 || error.status === 404) {
        return report.targetType === 'Post'
          ? 'Bai viet da bi xoa truoc do'
          : 'Binh luan da bi xoa truoc do';
      }
      throw error;
    }
  }

  async approveReport(requester, reportId) {
    this.assertAdmin(requester);
    const report = await ViolationReportRepository.findById(reportId);
    if (!report) throw new HttpError(404, 'Bao cao khong ton tai');
    if (report.status !== 'Pending') throw new HttpError(409, 'Bao cao nay da duoc xu ly');

    await getUserById(report.targetId);
    let actionTaken = await this.removeReportedContent(report);

    const previousViolations = await ViolationReportRepository.count({
      targetId: report.targetId,
      status: 'Approved',
    });
    const violationCount = previousViolations + 1;
    const banPayload = calculateBanPayload(violationCount);
    const bannedUser = await updateUserStatus(report.targetId, banPayload);

    actionTaken += banPayload.banReleaseDate
      ? `\nTai khoan bi khoa den ${new Date(banPayload.banReleaseDate).toISOString()}`
      : '\nTai khoan bi khoa vo thoi han';

    return ViolationReportRepository.updateById(reportId, {
      status: 'Approved',
      decision: 'Approved',
      actionTaken,
      resolvedBy: requester.userId,
      resolvedAt: new Date(),
      banInfo: bannedUser,
    });
  }

  async rejectReport(requester, reportId, reason) {
    this.assertAdmin(requester);
    const note = reason?.trim();
    if (!note || note.length < 5) {
      throw new HttpError(400, 'Ly do tu choi phai co it nhat 5 ky tu');
    }

    const report = await ViolationReportRepository.findById(reportId);
    if (!report) throw new HttpError(404, 'Bao cao khong ton tai');
    if (report.status !== 'Pending') throw new HttpError(409, 'Bao cao nay da duoc xu ly');

    return ViolationReportRepository.updateById(reportId, {
      status: 'Rejected',
      decision: 'Rejected',
      actionTaken: `Tu choi voi ly do: ${note}`,
      resolvedBy: requester.userId,
      resolvedAt: new Date(),
    });
  }

  async resolveReport(requester, reportId, payload = {}) {
    const decision = payload.decision || payload.status;
    if (String(decision).toLowerCase() === 'approved') {
      return this.approveReport(requester, reportId);
    }
    if (String(decision).toLowerCase() === 'rejected') {
      return this.rejectReport(requester, reportId, payload.reason || 'Bao cao khong hop le');
    }
    throw new HttpError(400, 'decision phai la Approved hoac Rejected');
  }
}

export default new ViolationReportService();
