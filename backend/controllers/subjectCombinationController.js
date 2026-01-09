import SubjectCombination from '../models/SubjectCombination.js';
import Subject from '../models/Subject.js';
import { parseSubjectCombinationsFromDocx, validateSubjectCombinations } from '../utils/docxParser.js';

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

        if (subjects.length !== 3) {
            return res.status(400).json({
                success: false,
                message: 'Tổ hợp môn phải gồm đúng 3 môn học'
            });
        }

        const subjectIds = [];
        for (const subjectId of subjects) {
            const subject = await Subject.findById(subjectId);
            if (!subject) {
                return res.status(400).json({
                    success: false,
                    message: `Môn học với id '${subjectId}' không tồn tại`
                });
            }
            subjectIds.push(subject._id);
        }

        const uniqueSubjectIds = new Set(subjectIds.map(id => id.toString()));
        if (uniqueSubjectIds.size !== subjectIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Không được chọn cùng một môn học nhiều lần'
            });
        }

        const newCombination = new SubjectCombination({
            combinationName: combinationName.trim(),
            subjects: subjectIds
        });

        const savedCombination = await newCombination.save();
        const populatedCombination = await savedCombination.populate('subjects', 'name');

        res.status(201).json({
            success: true,
            message: 'Tạo kết hợp môn học thành công',
            data: populatedCombination
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
            if (subjects.length !== 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Tổ hợp môn phải gồm đúng 3 môn học'
                });
            }

            const subjectIds = [];
            for (const subjectId of subjects) {
                const subject = await Subject.findById(subjectId);
                if (!subject) {
                    return res.status(400).json({
                        success: false,
                        message: `Môn học với id '${subjectId}' không tồn tại`
                    });
                }
                subjectIds.push(subject._id);
            }

            const uniqueSubjectIds = new Set(subjectIds.map(id => id.toString()));
            if (uniqueSubjectIds.size !== subjectIds.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Không được chọn cùng một môn học nhiều lần'
                });
            }

            combination.subjects = subjectIds;
        }

        const updated = await combination.save();
        const populatedCombination = await updated.populate('subjects', 'name');

        res.status(200).json({
            success: true,
            message: 'Cập nhật kết hợp môn học thành công',
            data: populatedCombination
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

export const importSubjectCombinationsFromDocx = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng upload file .docx'
            });
        }

        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
        if (fileExtension !== 'docx') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ chấp nhận file .docx'
            });
        }

        const parseResult = await parseSubjectCombinationsFromDocx(req.file.path);

        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                message: parseResult.message,
                error: parseResult.error
            });
        }

        const validationResult = validateSubjectCombinations(parseResult.data);
        if (!validationResult.valid) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: validationResult.errors
            });
        }

        const combinationNames = new Set();
        const duplicates = [];

        parseResult.data.forEach((combo, index) => {
            if (combinationNames.has(combo.combinationName.toLowerCase())) {
                duplicates.push({
                    index,
                    combinationName: combo.combinationName,
                    message: 'Mã tổ hợp bị trùng trong file'
                });
            }
            combinationNames.add(combo.combinationName.toLowerCase());
        });

        if (duplicates.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Phát hiện tổ hợp môn bị trùng',
                duplicates: duplicates
            });
        }

        const existingCombos = await SubjectCombination.find({
            combinationName: {
                $in: parseResult.data.map(c => new RegExp(`^${c.combinationName}$`, 'i'))
            }
        });

        const existingNames = new Set(
            existingCombos.map(c => c.combinationName.toLowerCase())
        );

        const toCreate = [];
        const toUpdate = [];

        parseResult.data.forEach(combo => {
            if (existingNames.has(combo.combinationName.toLowerCase())) {
                toUpdate.push(combo);
            } else {
                toCreate.push(combo);
            }
        });

        const createdCombos = [];
        const createErrors = [];

        for (const combo of toCreate) {
            try {
                const newCombination = new SubjectCombination({
                    combinationName: combo.combinationName.trim(),
                    subjects: combo.subjects.map(s => s.trim())
                });
                const saved = await newCombination.save();
                createdCombos.push(saved);
            } catch (error) {
                createErrors.push({
                    combinationName: combo.combinationName,
                    error: error.message
                });
            }
        }

        const updatedCombos = [];
        const updateErrors = [];

        for (const combo of toUpdate) {
            try {
                const updated = await SubjectCombination.findOneAndUpdate(
                    { combinationName: { $regex: `^${combo.combinationName}$`, $options: 'i' } },
                    {
                        subjects: combo.subjects.map(s => s.trim())
                    },
                    { new: true }
                );
                if (updated) {
                    updatedCombos.push(updated);
                }
            } catch (error) {
                updateErrors.push({
                    combinationName: combo.combinationName,
                    error: error.message
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Import tổ hợp môn thành công',
            summary: {
                total: parseResult.data.length,
                created: createdCombos.length,
                updated: updatedCombos.length,
                errors: createErrors.length + updateErrors.length
            },
            data: {
                created: createdCombos,
                updated: updatedCombos
            },
            errors: createErrors.length > 0 || updateErrors.length > 0 
                ? { createErrors, updateErrors }
                : null,
            parseWarnings: parseResult.errors
        });

    } catch (error) {
        console.error('Import subject combinations error:', error);

        res.status(500).json({
            success: false,
            message: 'Lỗi import tổ hợp môn',
            error: error.message
        });
    } finally {
        // Xóa file upload dù thành công hay lỗi
        if (req.file && req.file.path) {
            try {
                const fs = (await import('fs')).default;
                fs.unlinkSync(req.file.path);
                console.log('Temp file deleted:', req.file.path);
            } catch (e) {
                console.error('Error deleting temp file:', e);
            }
        }
    }
};
