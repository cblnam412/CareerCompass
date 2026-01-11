import ViolationReport from '../models/ViolationReport.js';
import User from '../models/User.js';
import ForumPost from '../models/ForumPost.js';
import ForumComment from '../models/ForumComment.js';
import { banAccount } from '../utils/banUtils.js';

export const createReport = async (req, res) => {
    try {
        const reporterId = req.userId;
        const { targerId, targetType, targetItemId, reason } = req.body;

        if (!targerId || !['Post', 'Comment'].includes(targetType) || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin: targerId, targetType, reason'
            });
        }

        if (reporterId === targerId) {
            return res.status(400).json({
                success: false,
                message: 'Không thể tự tố cáo chính mình'
            });
        }

        if (targetType === 'Post') {
            const post = await ForumPost.findById(targetItemId);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Bài viết không tồn tại'
                });
            }
        } else if (targetType === 'Comment') {
            const comment = await ForumComment.findById(targetItemId);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Bình luận không tồn tại'
                });
            }
        }

        const existingReport = await ViolationReport.findOne({
            reporterId,
            targetItemId,
            status: 'Pending'
        });

        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã tố cáo nội dung này rồi'
            });
        }

        const report = new ViolationReport({
            reporterId,
            targerId,
            targetType,
            targetItemId,
            reason
        });

        await report.save();

        res.status(201).json({
            success: true,
            message: 'Tố cáo đã được gửi. Cảm ơn bạn đã giúp chúng tôi cải thiện cộng đồng',
            data: report
        });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo tố cáo',
            error: error.message
        });
    }
};

export const getReports = async (req, res) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin có thể xem báo cáo'
            });
        }

        const { status, targetType, page = 1, limit = 10 } = req.query;
        const filter = {};

        const statusMap = {
            'pending': 'Pending',
            'rejected': 'Rejected',   
            'dismissed': 'Rejected',
            'approved': 'Approved'
        };
        
        if (status && status !== 'all') {
            filter.status = statusMap[status] || status;
        }

        if (targetType) {
            filter.targetType = targetType;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const reports = await ViolationReport.find(filter)
            .populate('reporterId', 'fullName email avatar')
            .populate('targerId', 'fullName email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ViolationReport.countDocuments(filter);
        const pages = Math.ceil(total / parseInt(limit));

        // Normalize report fields for frontend
        const normalizedReports = reports.map(report => ({
            _id: report._id,
            reported_item_type: report.targetType.toLowerCase(), // 'Post' -> 'post'
            reported_item_id: report.targetItemId,
            reporter_id: {
                _id: report.reporterId?._id,
                full_name: report.reporterId?.fullName || 'Unknown',
                email: report.reporterId?.email,
                avatar: report.reporterId?.avatar
            },
            content: report.reason,
            status: report.status.toLowerCase(), // 'Pending' -> 'pending'
            created_at: report.createdAt,
            processing_action: report.actionTaken || ''
        }));

        res.status(200).json({
            success: true,
            data: {
                reports: normalizedReports,
                total: total,
                pages: pages,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách báo cáo',
            error: error.message
        });
    }
};

export const getReportDetail = async (req, res) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin có thể xem báo cáo'
            });
        }

        const { reportId } = req.params;
        const report = await ViolationReport.findById(reportId)
            .populate('reporterId', 'fullName email avatar')
            .populate('targerId', 'fullName email avatar');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        let targetContent = null;
        if (report.targetType === 'Post') {
            targetContent = await ForumPost.findById(report.targetItemId).select('title content');
        } else if (report.targetType === 'Comment') {
            targetContent = await ForumComment.findById(report.targetItemId).select('content');
        }

        res.status(200).json({
            success: true,
            data: {
                report,
                targetContent
            }
        });
    } catch (error) {
        console.error('Get report detail error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết báo cáo',
            error: error.message
        });
    }
};

export const approveReport = async (req, res) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin có thể xử lý báo cáo'
            });
        }

        const { reportId } = req.params;

        const report = await ViolationReport.findById(reportId);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        const targetUser = await User.findById(report.targerId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User bị tố cáo không tồn tại'
            });
        }

        let actionTaken = '';

        if (report.targetType === 'Post') {
            await ForumPost.findByIdAndDelete(report.targetItemId);
            actionTaken = 'Đã xóa bài viết';
        } else if (report.targetType === 'Comment') {
            const commentToDelete = await ForumComment.findById(report.targetItemId);
            
            if (commentToDelete) {
                await ForumComment.findByIdAndDelete(report.targetItemId);
                
                if (commentToDelete.postId) {
                    await ForumPost.findByIdAndUpdate(commentToDelete.postId, { 
                        $inc: { commentCount: -1 } 
                    });
                }
                actionTaken = 'Đã xóa bình luận';
            } else {
                actionTaken = 'Bình luận đã bị xóa trước đó';
            }
        }

        const previousViolations = await ViolationReport.countDocuments({
            targerId: report.targerId,
            status: 'Approved'
        });

        const violationCount = previousViolations + 1;
        const banResult = await banAccount(report.targerId, violationCount);
        
        actionTaken += `\nTài khoản bị ban: ${banResult.message}`;

        report.status = 'Approved';
        report.actionTaken = actionTaken;
        await report.save();

        res.status(200).json({
            success: true,
            message: 'Báo cáo đã được chấp nhận. Bài viết/bình luận đã bị xóa và tài khoản đã bị ban',
            data: report
        });
    } catch (error) {
        console.error('Approve report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi chấp nhận báo cáo',
            error: error.message
        });
    }
};

export const rejectReport = async (req, res) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin có thể xử lý báo cáo'
            });
        }

        const { reportId } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim().length < 5) {
            return res.status(400).json({
                success: false,
                message: 'Lý do từ chối phải có ít nhất 5 ký tự'
            });
        }

        const report = await ViolationReport.findById(reportId);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        report.status = 'Rejected';
        report.actionTaken = `Từ chối với lý do: ${reason}`;
        await report.save();

        res.status(200).json({
            success: true,
            message: 'Báo cáo đã bị từ chối',
            data: report
        });
    } catch (error) {
        console.error('Reject report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi từ chối báo cáo',
            error: error.message
        });
    }
};

export const resolveReport = async (req, res) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin có thể xử lý báo cáo'
            });
        }

        const { reportId } = req.params;
        const { decision } = req.body; 

        if (!['Approved', 'Rejected'].includes(decision)) {
            return res.status(400).json({
                success: false,
                message: 'Decision phải là Approved hoặc Rejected'
            });
        }

        const report = await ViolationReport.findById(reportId);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        const targetUser = await User.findById(report.targerId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User bị tố cáo không tồn tại'
            });
        }

        let actionTaken = '';

        if (decision === 'Approved') {
            if (report.targetType === 'Post') {
                await ForumPost.findByIdAndDelete(report.targetItemId);
                actionTaken = 'Đã xóa bài viết';
            } else if (report.targetType === 'Comment') {
                await ForumComment.findByIdAndDelete(report.targetItemId);
                actionTaken = 'Đã xóa bình luận';
            }

            const previousViolations = await ViolationReport.countDocuments({
                targerId: report.targerId,
                status: 'Resolved',
                decision: 'Approved'
            });

            const violationCount = previousViolations + 1;

            const banResult = await banAccount(report.targerId, violationCount);
            
            actionTaken += `\nTài khoản bị ban: ${banResult.message}`;

            report.status = 'Resolved';
            report.decision = decision;
            report.actionTaken = actionTaken;
            await report.save();

            res.status(200).json({
                success: true,
                message: 'Báo cáo đã được chấp nhận. Bài viết/bình luận đã bị xóa và tài khoản đã bị ban',
                data: {
                    report,
                    banInfo: banResult
                }
            });
        } else {
            report.status = 'Resolved';
            report.decision = decision;
            report.actionTaken = 'Báo cáo bị từ chối';
            await report.save();

            res.status(200).json({
                success: true,
                message: 'Báo cáo đã bị từ chối',
                data: report
            });
        }
    } catch (error) {
        console.error('Resolve report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xử lý báo cáo',
            error: error.message
        });
    }
};

export const getMyReports = async (req, res) => {
    try {
        const reporterId = req.userId;

        const reports = await ViolationReport.find({ reporterId })
            .populate('targerId', 'fullName email avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error('Get my reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử tố cáo',
            error: error.message
        });
    }
};

export default {
    createReport,
    getReports,
    getReportDetail,
    resolveReport,
    approveReport,
    rejectReport,
    getMyReports
};
