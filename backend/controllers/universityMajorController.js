import UniversityMajor from '../models/UniversityMajor.js';
import Major from '../models/Major.js';
import University from '../models/University.js';

export const getAllUniversityMajors = async (req, res) => {
    try {
        const { majorId, universityId, page = 1, limit = 20, search } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        if (majorId) query.majorId = majorId;
        if (universityId) query.universityId = universityId;
        if (search) {
            query.$or = [
                { majorName: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await UniversityMajor.countDocuments(query);
        const data = await UniversityMajor.find(query)
            .populate('majorId', 'name category')
            .populate('universityId', 'name code region')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getUniversityMajorById = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await UniversityMajor.findById(id)
            .populate('majorId')
            .populate('universityId');

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'UniversityMajor not found'
            });
        }

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const createUniversityMajor = async (req, res) => {
    try {
        const { universityId, majorId, majorName, tutionFee, duration, quota, addmissionMethods } = req.body;

        // Validate
        if (!universityId || !majorId || !majorName) {
            return res.status(400).json({
                success: false,
                message: 'universityId, majorId, and majorName are required'
            });
        }

        const university = await University.findById(universityId);
        const major = await Major.findById(majorId);

        if (!university || !major) {
            return res.status(404).json({
                success: false,
                message: 'University or Major not found'
            });
        }

        // Kiểm tra duplicate
        const existing = await UniversityMajor.findOne({ universityId, majorId });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'This UniversityMajor combination already exists'
            });
        }

        const newRecord = new UniversityMajor({
            universityId,
            majorId,
            majorName,
            tutionFee: tutionFee || 0,
            duration: duration || 0,
            quota: quota || 0,
            addmissionMethods: addmissionMethods || []
        });

        const saved = await newRecord.save();
        const populated = await saved.populate('majorId').populate('universityId');

        res.status(201).json({
            success: true,
            message: 'UniversityMajor created successfully',
            data: populated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateUniversityMajor = async (req, res) => {
    try {
        const { id } = req.params;
        const { majorName, tutionFee, duration, quota, addmissionMethods } = req.body;

        const data = await UniversityMajor.findByIdAndUpdate(
            id,
            {
                majorName,
                tutionFee,
                duration,
                quota,
                addmissionMethods
            },
            { new: true, runValidators: true }
        ).populate('majorId').populate('universityId');

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'UniversityMajor not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'UniversityMajor updated successfully',
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteUniversityMajor = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await UniversityMajor.findByIdAndDelete(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'UniversityMajor not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'UniversityMajor deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const importFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const records = req.excelData || []; // Dữ liệu từ middleware parseExcel

        if (records.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid records in Excel file'
            });
        }

        const results = {
            imported: 0,
            skipped: 0,
            errors: []
        };

        for (const record of records) {
            try {
                const major = await Major.findOne({
                    name: new RegExp(record.majorGroupName, 'i')
                });

                const university = await University.findOne({
                    name: new RegExp(record.universityName, 'i')
                });

                if (!major) {
                    results.skipped++;
                    results.errors.push(`Major not found: ${record.majorGroupName}`);
                    continue;
                }

                if (!university) {
                    results.skipped++;
                    results.errors.push(`University not found: ${record.universityName}`);
                    continue;
                }

                const existing = await UniversityMajor.findOne({
                    universityId: university._id,
                    majorId: major._id
                });

                if (existing) {
                    results.skipped++;
                    continue;
                }

                await UniversityMajor.create({
                    universityId: university._id,
                    majorId: major._id,
                    majorName: record.majorName,
                    tutionFee: parseFloat(record.tuition) || 0,
                    duration: 0,
                    quota: 0,
                    addmissionMethods: record.subjects ? [record.subjects] : []
                });

                results.imported++;
            } catch (err) {
                results.errors.push(`Error processing row: ${err.message}`);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Import completed',
            results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
