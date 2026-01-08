import University from '../models/University.js';
import { parseUniversitiesFromExcel, validateBulkUniversities } from '../utils/excelParserUtils.js';
import fs from 'fs';

export const createUniversity = async (req, res) => {
    try {
        const { name, code, description, address, website, region, phone } = req.body;

        if (!name || !code) {
            return res.status(400).json({
                success: false,
                message: 'Name and code are required'
            });
        }

        const existingUni = await University.findOne({ code });
        if (existingUni) {
            return res.status(409).json({
                success: false,
                message: 'University with this code already exists'
            });
        }

        const newUni = new University({
            name,
            code,
            description: description || '',
            address: address || '',
            website: website || '',
            region: region || '',
            phone: Array.isArray(phone) ? phone : (phone ? [phone] : [])
        });

        const savedUni = await newUni.save();

        res.status(201).json({
            success: true,
            message: 'University created successfully',
            data: savedUni
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const importUniversitiesFromExcel = async (req, res) => {
    let uploadedFile = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        uploadedFile = req.file.path;

        // Parse Excel file
        const universities = await parseUniversitiesFromExcel(uploadedFile);

        if (universities.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid universities found in Excel file'
            });
        }

        const validation = validateBulkUniversities(universities);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const existingCodes = await University.find({
            code: { $in: validation.validRecords.map(u => u.code) }
        }).select('code');

        const existingCodeSet = new Set(existingCodes.map(u => u.code));
        const newUniversities = validation.validRecords.filter(
            u => !existingCodeSet.has(u.code)
        );

        if (newUniversities.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'All universities in file already exist in database',
                skipped: validation.validRecords.length
            });
        }

        const insertedUniversities = await University.insertMany(newUniversities);

        res.status(201).json({
            success: true,
            message: `${insertedUniversities.length} universities imported successfully`,
            imported: insertedUniversities.length,
            skipped: validation.validRecords.length - insertedUniversities.length,
            data: insertedUniversities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        if (uploadedFile && fs.existsSync(uploadedFile)) {
            fs.unlinkSync(uploadedFile);
        }
    }
};

export const getAllUniversities = async (req, res) => {
    try {
        const universities = await University.find();
        res.status(200).json({
            success: true,
            count: universities.length,
            data: universities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getUniversityById = async (req, res) => {
    try {
        const university = await University.findById(req.params.id);
        
        if (!university) {
            return res.status(404).json({
                success: false,
                message: 'University not found'
            });
        }

        res.status(200).json({
            success: true,
            data: university
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateUniversity = async (req, res) => {
    try {
        const { name, code, description, address, website, region, phone } = req.body;

        const university = await University.findByIdAndUpdate(
            req.params.id,
            {
                name,
                code,
                description,
                address,
                website,
                region,
                phone: Array.isArray(phone) ? phone : (phone ? [phone] : undefined)
            },
            { new: true, runValidators: true }
        );

        if (!university) {
            return res.status(404).json({
                success: false,
                message: 'University not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'University updated successfully',
            data: university
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteUniversity = async (req, res) => {
    try {
        const university = await University.findByIdAndDelete(req.params.id);

        if (!university) {
            return res.status(404).json({
                success: false,
                message: 'University not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'University deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
