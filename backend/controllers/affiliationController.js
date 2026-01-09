import UniversityAffiliation from '../models/UniversityAffiliation.js';
import University from '../models/University.js';
import User from '../models/User.js';
import { deleteFileFromSupabase } from '../utils/supabaseUtils.js';

export const getAffiliations = async (req, res) => {
    try {
        const { status, limit = 10, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) {
            filter.status = status;
        }

        const affiliations = await UniversityAffiliation.find(filter)
            .populate('studentId', 'fullName email DOB studentId address')
            .populate('universityId', 'name code')
            .populate('reviewerId', 'fullName email')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await UniversityAffiliation.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: affiliations,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get affiliations error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách yêu cầu',
            error: error.message
        });
    }
};

export const getAffiliationById = async (req, res) => {
    try {
        const { id } = req.params;

        const affiliation = await UniversityAffiliation.findById(id)
            .populate('studentId', 'fullName email DOB studentId address status role')
            .populate('universityId', 'name code')
            .populate('reviewerId', 'fullName email');

        if (!affiliation) {
            return res.status(404).json({
                success: false,
                message: 'Yêu cầu không tồn tại'
            });
        }

        res.status(200).json({
            success: true,
            data: affiliation
        });

    } catch (error) {
        console.error('Get affiliation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy chi tiết yêu cầu',
            error: error.message
        });
    }
};

export const approveAffiliation = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewNote } = req.body;

        const affiliation = await UniversityAffiliation.findById(id);

        if (!affiliation) {
            return res.status(404).json({
                success: false,
                message: 'Yêu cầu không tồn tại'
            });
        }

        if (affiliation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Không thể duyệt yêu cầu này vì trạng thái hiện tại là '${affiliation.status}'`
            });
        }

        affiliation.status = 'approved';
        affiliation.reviewerId = req.user._id;
        affiliation.reviewNote = reviewNote || '';
        affiliation.reviewedAt = new Date();

        await affiliation.save();

        const user = await User.findById(affiliation.studentId);
        if (user) {
            user.status = 'active';
            await user.save();
        }

        const updatedAffiliation = await UniversityAffiliation.findById(id)
            .populate('studentId', 'fullName email status')
            .populate('universityId', 'name code')
            .populate('reviewerId', 'fullName email');

        res.status(200).json({
            success: true,
            message: 'Đã phê duyệt yêu cầu xin làm sinh viên đại diện trường',
            data: updatedAffiliation
        });

    } catch (error) {
        console.error('Approve affiliation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi phê duyệt yêu cầu',
            error: error.message
        });
    }
};

export const rejectAffiliation = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewNote } = req.body;

        if (!reviewNote || reviewNote.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp lý do từ chối'
            });
        }

        const affiliation = await UniversityAffiliation.findById(id);

        if (!affiliation) {
            return res.status(404).json({
                success: false,
                message: 'Yêu cầu không tồn tại'
            });
        }

        if (affiliation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Không thể từ chối yêu cầu này vì trạng thái hiện tại là '${affiliation.status}'`
            });
        }

        affiliation.status = 'rejected';
        affiliation.reviewerId = req.user._id;
        affiliation.reviewNote = reviewNote;
        affiliation.reviewedAt = new Date();

        await affiliation.save();

        const user = await User.findById(affiliation.studentId);
        if (user) {
            user.status = 'banned';
            user.banReleaseDate = null;
            await user.save();
        }

        const updatedAffiliation = await UniversityAffiliation.findById(id)
            .populate('studentId', 'fullName email status')
            .populate('universityId', 'name code')
            .populate('reviewerId', 'fullName email');

        res.status(200).json({
            success: true,
            message: 'Đã từ chối yêu cầu xin làm sinh viên đại diện trường',
            data: updatedAffiliation
        });

    } catch (error) {
        console.error('Reject affiliation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi từ chối yêu cầu',
            error: error.message
        });
    }
};


export const getAffiliationsByUniversity = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, limit = 10, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const university = await University.findById(id);
        if (!university) {
            return res.status(404).json({
                success: false,
                message: 'Trường đại học không tồn tại'
            });
        }

        const filter = { universityId: id };
        if (status) {
            filter.status = status;
        }

        const affiliations = await UniversityAffiliation.find(filter)
            .populate('studentId', 'fullName email DOB studentId address')
            .populate('reviewerId', 'fullName email')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await UniversityAffiliation.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: affiliations,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get affiliations by university error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách yêu cầu',
            error: error.message
        });
    }
};

export const getAffiliationStats = async (req, res) => {
    try {
        const stats = {
            total: await UniversityAffiliation.countDocuments(),
            pending: await UniversityAffiliation.countDocuments({ status: 'pending' }),
            approved: await UniversityAffiliation.countDocuments({ status: 'approved' }),
            rejected: await UniversityAffiliation.countDocuments({ status: 'rejected' })
        };

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Get affiliation stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thống kê',
            error: error.message
        });
    }
};
