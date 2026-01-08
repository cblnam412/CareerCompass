import Major from '../models/Major.js';
import { parseTextFile, validateBulkMajors, exportToCSV } from '../utils/fileParserUtils.js';
import fs from 'fs';

export const createMajor = async (req, res) => {
    try {
        const { name, category, description } = req.body;

        const existingMajor = await Major.findOne({ name: name.trim() });
        if (existingMajor) {
            return res.status(409).json({
                success: false,
                message: 'Major with this name already exists'
            });
        }

        const major = new Major({
            name: name.trim(),
            category: category.trim(),
            description: description ? description.trim() : ''
        });

        await major.save();

        res.status(201).json({
            success: true,
            message: 'Major created successfully',
            data: major
        });
    } catch (error) {
        console.error('Error creating major:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating major',
            error: error.message
        });
    }
};

export const createMajorsFromFile = async (req, res) => {
    let uploadedFile = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        uploadedFile = req.file.path;

        const majorsData = parseTextFile(uploadedFile);

        const validation = validateBulkMajors(majorsData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const existingNames = await Major.find({
            name: { $in: majorsData.map(m => m.name.trim()) }
        }).select('name');

        const duplicateNames = existingNames.map(m => m.name);

        if (duplicateNames.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Some majors already exist',
                duplicates: duplicateNames,
                successCount: majorsData.length - duplicateNames.length,
                totalCount: majorsData.length
            });
        }

        const cleanedData = majorsData.map(m => ({
            name: m.name.trim(),
            category: m.category.trim(),
            description: m.description ? m.description.trim() : ''
        }));

        const result = await Major.insertMany(cleanedData);

        res.status(201).json({
            success: true,
            message: `Successfully created ${result.length} majors`,
            count: result.length,
            data: result
        });
    } catch (error) {
        console.error('Error creating majors from file:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating majors from file',
            error: error.message
        });
    } finally {
        if (uploadedFile && fs.existsSync(uploadedFile)) {
            fs.unlink(uploadedFile, (err) => {
                if (err) console.error('Error deleting temp file:', err);
            });
        }
    }
};

export const updateMajor = async (req, res) => {
    try {
        const { majorId } = req.params;
        const { name, category, description } = req.body;

        const major = await Major.findById(majorId);
        if (!major) {
            return res.status(404).json({
                success: false,
                message: 'Major not found'
            });
        }

        if (name && name !== major.name) {
            const existingMajor = await Major.findOne({ 
                name: name.trim(),
                _id: { $ne: majorId }
            });
            if (existingMajor) {
                return res.status(409).json({
                    success: false,
                    message: 'Major with this name already exists'
                });
            }
        }

        if (name) major.name = name.trim();
        if (category) major.category = category.trim();
        if (description !== undefined) major.description = description ? description.trim() : '';

        await major.save();

        res.status(200).json({
            success: true,
            message: 'Major updated successfully',
            data: major
        });
    } catch (error) {
        console.error('Error updating major:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating major',
            error: error.message
        });
    }
};

export const deleteMajor = async (req, res) => {
    try {
        const { majorId } = req.params;

        const major = await Major.findByIdAndDelete(majorId);
        if (!major) {
            return res.status(404).json({
                success: false,
                message: 'Major not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Major deleted successfully',
            data: major
        });
    } catch (error) {
        console.error('Error deleting major:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting major',
            error: error.message
        });
    }
};

export const deleteMajors = async (req, res) => {
    try {
        const { majorIds } = req.body;

        if (!majorIds || !Array.isArray(majorIds) || majorIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'majorIds array is required and must not be empty'
            });
        }

        const result = await Major.deleteMany({ _id: { $in: majorIds } });

        res.status(200).json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} majors`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error deleting majors:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting majors',
            error: error.message
        });
    }
};

export const getAllMajors = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            category = '',
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (category) {
            filter.category = { $regex: category, $options: 'i' };
        }

        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const majors = await Major.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);

        const total = await Major.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Majors retrieved successfully',
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            },
            data: majors
        });
    } catch (error) {
        console.error('Error getting majors:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving majors',
            error: error.message
        });
    }
};

export const getMajorById = async (req, res) => {
    try {
        const { majorId } = req.params;

        const major = await Major.findById(majorId);
        if (!major) {
            return res.status(404).json({
                success: false,
                message: 'Major not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Major retrieved successfully',
            data: major
        });
    } catch (error) {
        console.error('Error getting major:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving major',
            error: error.message
        });
    }
};

export const searchMajors = async (req, res) => {
    try {
        const { keyword } = req.query;

        if (!keyword || keyword.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search keyword is required'
            });
        }

        const majors = await Major.find({
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { category: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ]
        }).limit(20);

        res.status(200).json({
            success: true,
            message: 'Search completed',
            count: majors.length,
            data: majors
        });
    } catch (error) {
        console.error('Error searching majors:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching majors',
            error: error.message
        });
    }
};

export const getMajorsByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        const majors = await Major.find({ 
            category: { $regex: category, $options: 'i' } 
        }).sort({ name: 1 });

        res.status(200).json({
            success: true,
            message: `Majors in category '${category}' retrieved successfully`,
            count: majors.length,
            data: majors
        });
    } catch (error) {
        console.error('Error getting majors by category:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving majors',
            error: error.message
        });
    }
};

export const getAllCategories = async (req, res) => {
    try {
        const categories = await Major.distinct('category');

        res.status(200).json({
            success: true,
            message: 'Categories retrieved successfully',
            count: categories.length,
            data: categories
        });
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving categories',
            error: error.message
        });
    }
};

export const getMajorStats = async (req, res) => {
    try {
        const totalMajors = await Major.countDocuments();
        
        const stats = await Major.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            message: 'Statistics retrieved successfully',
            data: {
                totalMajors,
                byCategory: stats
            }
        });
    } catch (error) {
        console.error('Error getting major stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving statistics',
            error: error.message
        });
    }
};

export const exportMajorsToCSV = async (req, res) => {
    try {
        const majors = await Major.find().select('name category description');

        const csv = exportToCSV(majors);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=majors_${new Date().getTime()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting majors:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting majors',
            error: error.message
        });
    }
};
