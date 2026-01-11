import UniversityMajor from '../models/UniversityMajor.js';
import { 
    scrapeAdmissionScores, 
    bulkUpdateAdmissionScores, 
    getOutdatedUniversityMajors,
    updateAdmissionScore 
} from '../utils/scraperUtils.js';

/**
 * Admin: Scrape admission scores from vnexpress
 */
export const scrapeAndUpdateScores = async (req, res) => {
    try {
        // Check admin role
        if (req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin mới có quyền thực hiện tác vụ này'
            });
        }

        const scrapeResult = await scrapeAdmissionScores();
        
        if (!scrapeResult.success) {
            return res.status(500).json(scrapeResult);
        }

        // Bulk update with scraped data
        const updateResult = await bulkUpdateAdmissionScores(scrapeResult.data);

        res.status(200).json({
            success: true,
            message: 'Cào và cập nhật điểm chuẩn thành công',
            scrapeNote: scrapeResult.note,
            updateStats: updateResult.results
        });

    } catch (error) {
        console.error('Scrape and update error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cào dữ liệu',
            error: error.message
        });
    }
};

/**
 * Admin: Get outdated UniversityMajors that need update
 */
export const getOutdatedMajors = async (req, res) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin mới có quyền'
            });
        }

        const result = await getOutdatedUniversityMajors();
        res.status(200).json(result);

    } catch (error) {
        console.error('Get outdated majors error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Admin: Manually update admission score for a UniversityMajor
 */
export const updateMajorScore = async (req, res) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin mới có quyền'
            });
        }

        const { universityMajorId, admissionScore, year } = req.body;

        if (!universityMajorId || admissionScore === undefined) {
            return res.status(400).json({
                success: false,
                message: 'universityMajorId và admissionScore là bắt buộc'
            });
        }

        const result = await updateAdmissionScore(universityMajorId, admissionScore, year);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật điểm chuẩn thành công',
            data: result.data
        });

    } catch (error) {
        console.error('Update score error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Admin: Bulk update admission scores
 */
export const bulkUpdateScores = async (req, res) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin mới có quyền'
            });
        }

        const { updates } = req.body;

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Updates phải là mảng không rỗng'
            });
        }

        const result = await bulkUpdateAdmissionScores(updates);

        res.status(200).json({
            success: true,
            message: `Cập nhật ${result.results.updated} ngành, lỗi ${result.results.failed}`,
            stats: result.results
        });

    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Admin: Get all UniversityMajors with filters
 */
export const getUniversityMajorsForAdmin = async (req, res) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin mới có quyền'
            });
        }

        const { universityId, majorId, hasScore, page = 1, limit = 20 } = req.query;

        let query = {};

        if (universityId) query.universityId = universityId;
        if (majorId) query.majorId = majorId;
        
        if (hasScore === 'true') {
            query.admissionScore = { $exists: true, $ne: null };
        } else if (hasScore === 'false') {
            query.$or = [
                { admissionScore: { $exists: false } },
                { admissionScore: null }
            ];
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            UniversityMajor.find(query)
                .populate('universityId', 'name code')
                .populate('majorId', 'name code')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            UniversityMajor.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get UniversityMajors error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
