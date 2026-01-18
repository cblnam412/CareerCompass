import University from '../models/University.js';
import provinces from '../../Data/provinces.js';
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

        const existingUni = await University.findOne({
            $or: [
                { name: { $regex: `^${name.trim()}$`, $options: 'i' } },
                { code: { $regex: `^${code.trim()}$`, $options: 'i' } }
            ]
        });

        if (existingUni) {
            const isNameDuplicate = existingUni.name.toLowerCase() === name.trim().toLowerCase();
            return res.status(400).json({
                success: false,
                message: isNameDuplicate 
                    ? `Tên trường "${name}" đã tồn tại` 
                    : `Mã trường "${code}" đã tồn tại`
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
        const universities = await University.find().select('_id name region');
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
        const { id } = req.params;
        const updateData = req.body;

        const university = await University.findById(id);

        if (!university) {
            return res.status(404).json({
                success: false,
                message: 'Trường đại học không tồn tại'
            });
        }

        // Check for duplicates only if name or code is being updated
        if (updateData.name || updateData.code) {
            const duplicateCheck = [];

            if (updateData.name) {
                duplicateCheck.push({
                    name: { $regex: `^${updateData.name.trim()}$`, $options: 'i' }
                });
            }

            if (updateData.code) {
                duplicateCheck.push({
                    code: { $regex: `^${updateData.code.trim()}$`, $options: 'i' }
                });
            }

            // Check if ANY document matches these criteria, excluding the current document 
            const existing = await University.findOne({
                $and: [
                    { _id: { $ne: id } }, 
                    { $or: duplicateCheck }
                ]
            });

            if (existing) {
                const isNameDuplicate = updateData.name && existing.name.toLowerCase() === updateData.name.trim().toLowerCase();
                return res.status(400).json({
                    success: false,
                    message: isNameDuplicate 
                        ? `Tên trường "${updateData.name}" đã được sử dụng bởi trường khác` 
                        : `Mã trường "${updateData.code}" đã được sử dụng bởi trường khác`
                });
            }
        }

        // Update fields if they exist in request
        if (updateData.name) university.name = updateData.name.trim();
        if (updateData.code) university.code = updateData.code.trim();
        if (updateData.description !== undefined) university.description = updateData.description;
        if (updateData.address !== undefined) university.address = updateData.address;
        if (updateData.website !== undefined) university.website = updateData.website;
        if (updateData.region !== undefined) university.region = updateData.region;
        if (updateData.phone !== undefined) university.phone = updateData.phone;

        const updatedUniversity = await university.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin trường thành công',
            data: updatedUniversity
        });

    } catch (error) {
        console.error('Update university error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật trường đại học',
            error: error.message
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

export const getProvinces = async (req, res) => {
    try {
        const provinceNames = provinces.map(province => province.name);
        
        provinceNames.sort((a, b) => a.localeCompare(b, 'vi'));

        res.status(200).json({
            success: true,
            count: provinces.length,
            data: provinceNames,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving province data',
            error: error.message
        });
    }
};