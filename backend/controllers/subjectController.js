import Subject from '../models/Subject.js';
import SubjectCombination from '../models/SubjectCombination.js';
import { parseSubjectsFromExcel } from '../utils/excelParserUtils.js';

export const getAllSubjects = async (req, res) => {
    try {
        const { search, limit = 10, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        const subjects = await Subject.find(filter)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ name: 1 });

        const total = await Subject.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: subjects,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get all subjects error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách môn học',
            error: error.message
        });
    }
};

export const getSubjectById = async (req, res) => {
    try {
        const { id } = req.params;

        const subject = await Subject.findById(id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Môn học không tồn tại'
            });
        }

        res.status(200).json({
            success: true,
            data: subject
        });

    } catch (error) {
        console.error('Get subject error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy chi tiết môn học',
            error: error.message
        });
    }
};

export const createSubject = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp name'
            });
        }

        const existingName = await Subject.findOne({
            name: { $regex: `^${name}$`, $options: 'i' }
        });

        if (existingName) {
            return res.status(400).json({
                success: false,
                message: 'Tên môn học này đã tồn tại'
            });
        }

        const newSubject = new Subject({
            name: name.trim().toLowerCase()
        });

        const savedSubject = await newSubject.save();

        res.status(201).json({
            success: true,
            message: 'Tạo môn học thành công',
            data: savedSubject
        });

    } catch (error) {
        console.error('Create subject error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo môn học',
            error: error.message
        });
    }
};

export const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const subject = await Subject.findById(id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Môn học không tồn tại'
            });
        }

        if (name) {
            const existingName = await Subject.findOne({
                _id: { $ne: id },
                name: { $regex: `^${name}$`, $options: 'i' }
            });

            if (existingName) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên môn học này đã tồn tại'
                });
            }

            subject.name = name.trim().toLowerCase();
        }

        await subject.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật môn học thành công',
            data: subject
        });

    } catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật môn học',
            error: error.message
        });
    }
};

export const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;

        const subject = await Subject.findById(id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Môn học không tồn tại'
            });
        }

        const SubjectCombination = (await import('../models/SubjectCombination.js')).default;
        const combination = await SubjectCombination.findOne({ subjects: id });

        if (combination) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa môn học này vì nó đang được sử dụng trong các tổ hợp môn'
            });
        }

        await Subject.deleteOne({ _id: id });

        res.status(200).json({
            success: true,
            message: 'Xóa môn học thành công'
        });

    } catch (error) {
        console.error('Delete subject error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xóa môn học',
            error: error.message
        });
    }
};
export const bulkImportSubjects = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn file Excel'
            });
        }

        const subjects = await parseSubjectsFromExcel(req.file.path);

        if (!subjects || subjects.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'File Excel không có dữ liệu môn học'
            });
        }

        const results = {
            created: [],
            duplicated: [],
            errors: []
        };

        for (const subjectData of subjects) {
            try {
                const existingSubject = await Subject.findOne({
                    name: { $regex: `^${subjectData.name}$`, $options: 'i' }
                });

                if (existingSubject) {
                    results.duplicated.push({
                        name: subjectData.name,
                        rowNumber: subjectData.rowNumber,
                        message: 'Tên môn học đã tồn tại'
                    });
                    continue;
                }

                const newSubject = new Subject({
                    name: subjectData.name.trim().toLowerCase()
                });

                const savedSubject = await newSubject.save();
                results.created.push({
                    name: savedSubject.name,
                    id: savedSubject._id,
                    rowNumber: subjectData.rowNumber
                });

            } catch (error) {
                results.errors.push({
                    name: subjectData.name,
                    rowNumber: subjectData.rowNumber,
                    message: error.message
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Import thành công ${results.created.length} môn học`,
            data: results
        });

    } catch (error) {
        console.error('Bulk import subjects error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi import môn học từ Excel',
            error: error.message
        });
    }
};