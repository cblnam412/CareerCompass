import SubjectCombination from '../models/SubjectCombination.js';

export const getAllSubjectCombinations = async (req, res) => {
    try {
        const { search, limit = 10, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (search) {
            filter.combinationName = { $regex: search, $options: 'i' };
        }

        const combinations = await SubjectCombination.find(filter)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ combinationName: 1 });

        const total = await SubjectCombination.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: combinations,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get all subject combinations error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách kết hợp môn học',
            error: error.message
        });
    }
};


export const getSubjectCombinationById = async (req, res) => {
    try {
        const { id } = req.params;

        const combination = await SubjectCombination.findById(id);

        if (!combination) {
            return res.status(404).json({
                success: false,
                message: 'Kết hợp môn học không tồn tại'
            });
        }

        res.status(200).json({
            success: true,
            data: combination
        });

    } catch (error) {
        console.error('Get subject combination error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy chi tiết kết hợp môn học',
            error: error.message
        });
    }
};


export const createSubjectCombination = async (req, res) => {
    try {
        const { combinationName, subjects } = req.body;

        // Validate
        if (!combinationName || !subjects || subjects.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp combinationName và danh sách môn học'
            });
        }

        const existing = await SubjectCombination.findOne({
            combinationName: { $regex: `^${combinationName}$`, $options: 'i' }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Kết hợp môn học này đã tồn tại'
            });
        }

        const newCombination = new SubjectCombination({
            combinationName: combinationName.trim(),
            subjects: subjects.map(s => s.trim()).filter(s => s.length > 0)
        });

        const savedCombination = await newCombination.save();

        res.status(201).json({
            success: true,
            message: 'Tạo kết hợp môn học thành công',
            data: savedCombination
        });

    } catch (error) {
        console.error('Create subject combination error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo kết hợp môn học',
            error: error.message
        });
    }
};

export const updateSubjectCombination = async (req, res) => {
    try {
        const { id } = req.params;
        const { combinationName, subjects } = req.body;

        const combination = await SubjectCombination.findById(id);

        if (!combination) {
            return res.status(404).json({
                success: false,
                message: 'Kết hợp môn học không tồn tại'
            });
        }

        if (combinationName) {
            const existing = await SubjectCombination.findOne({
                _id: { $ne: id },
                combinationName: { $regex: `^${combinationName}$`, $options: 'i' }
            });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên kết hợp môn học này đã tồn tại'
                });
            }

            combination.combinationName = combinationName.trim();
        }

        if (subjects && subjects.length > 0) {
            combination.subjects = subjects.map(s => s.trim()).filter(s => s.length > 0);
        }

        const updated = await combination.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật kết hợp môn học thành công',
            data: updated
        });

    } catch (error) {
        console.error('Update subject combination error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật kết hợp môn học',
            error: error.message
        });
    }
};

export const deleteSubjectCombination = async (req, res) => {
    try {
        const { id } = req.params;

        const combination = await SubjectCombination.findByIdAndDelete(id);

        if (!combination) {
            return res.status(404).json({
                success: false,
                message: 'Kết hợp môn học không tồn tại'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa kết hợp môn học thành công',
            data: combination
        });

    } catch (error) {
        console.error('Delete subject combination error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xóa kết hợp môn học',
            error: error.message
        });
    }
};
