import SoftSkill from '../models/SoftSkill.js';

export const getAllSoftSkills = async (req, res) => {
    try {
        const { search, limit = 10, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (search) {
            filter.softSkillName = { $regex: search, $options: 'i' };
        }

        const skills = await SoftSkill.find(filter)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ softSkillName: 1 });

        const total = await SoftSkill.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: skills,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get all soft skills error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách kỹ năng mềm',
            error: error.message
        });
    }
};

export const getSoftSkillById = async (req, res) => {
    try {
        const { id } = req.params;

        const skill = await SoftSkill.findById(id);

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: 'Kỹ năng mềm không tồn tại'
            });
        }

        res.status(200).json({
            success: true,
            data: skill
        });

    } catch (error) {
        console.error('Get soft skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy chi tiết kỹ năng mềm',
            error: error.message
        });
    }
};


export const createSoftSkill = async (req, res) => {
    try {
        const { softSkillName } = req.body;

        if (!softSkillName || softSkillName.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp tên kỹ năng mềm'
            });
        }

        const existing = await SoftSkill.findOne({
            softSkillName: { $regex: `^${softSkillName.trim()}$`, $options: 'i' }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Kỹ năng mềm này đã tồn tại'
            });
        }

        const newSkill = new SoftSkill({
            softSkillName: softSkillName.trim()
        });

        const savedSkill = await newSkill.save();

        res.status(201).json({
            success: true,
            message: 'Tạo kỹ năng mềm thành công',
            data: savedSkill
        });

    } catch (error) {
        console.error('Create soft skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo kỹ năng mềm',
            error: error.message
        });
    }
};

export const updateSoftSkill = async (req, res) => {
    try {
        const { id } = req.params;
        const { softSkillName } = req.body;

        const skill = await SoftSkill.findById(id);

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: 'Kỹ năng mềm không tồn tại'
            });
        }

        if (!softSkillName || softSkillName.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp tên kỹ năng mềm'
            });
        }

        const existing = await SoftSkill.findOne({
            _id: { $ne: id },
            softSkillName: { $regex: `^${softSkillName.trim()}$`, $options: 'i' }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Tên kỹ năng mềm này đã tồn tại'
            });
        }

        skill.softSkillName = softSkillName.trim();
        const updated = await skill.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật kỹ năng mềm thành công',
            data: updated
        });

    } catch (error) {
        console.error('Update soft skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật kỹ năng mềm',
            error: error.message
        });
    }
};

export const deleteSoftSkill = async (req, res) => {
    try {
        const { id } = req.params;

        const skill = await SoftSkill.findByIdAndDelete(id);

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: 'Kỹ năng mềm không tồn tại'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa kỹ năng mềm thành công',
            data: skill
        });

    } catch (error) {
        console.error('Delete soft skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xóa kỹ năng mềm',
            error: error.message
        });
    }
};
