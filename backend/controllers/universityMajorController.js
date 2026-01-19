import UniversityMajor from '../models/UniversityMajor.js';
import Major from '../models/Major.js';
import University from '../models/University.js';

const transformDataToPastScore = (data) => {
    if (Array.isArray(data)) {
        return data.map(item => {
            const itemObj = item.toObject ? item.toObject() : item;
            return {
                ...itemObj,
                pastScore: itemObj.admissionScore
            };
        });
    } else {
        const itemObj = data.toObject ? data.toObject() : data;
        return {
            ...itemObj,
            pastScore: itemObj.admissionScore
        };
    }
};

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
            data: transformDataToPastScore(data),
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
            data: transformDataToPastScore(data)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getMajorsByUniversity = async (req, res) => {
    try {
        const { universityId } = req.params;
        const { page = 1, limit = 20, search } = req.query;
        const skip = (page - 1) * limit;

        const university = await University.findById(universityId);
        if (!university) {
            return res.status(404).json({
                success: false,
                message: 'Trường đại học không tồn tại'
            });
        }

        let query = { universityId };
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
        
        console.log('Majors found:', data);

        res.status(200).json({
            success: true,
            data: transformDataToPastScore(data),
            university: {
                id: university._id,
                name: university.name,
                code: university.code
            },
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

export const createUniversityMajor = async (req, res) => {
    try {
        const { universityId, majorId, majorName, tuitionFee, duration, quota, admissionMethods, admissionScore } = req.body;

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
            tuitionFee: tuitionFee || 0,
            duration: duration || 0,
            quota: quota || 0,
            admissionScore: admissionScore || null,
            admissionMethods: admissionMethods || []
        });

        const saved = await newRecord.save();
        const populated = await saved.populate('majorId').populate('universityId');

        res.status(201).json({
            success: true,
            message: 'UniversityMajor created successfully',
            data: transformDataToPastScore(populated)
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
        const { majorName, tuitionFee, duration, quota, admissionMethods, admissionScore } = req.body;

        const data = await UniversityMajor.findByIdAndUpdate(
            id,
            {
                majorName,
                tuitionFee,
                duration,
                quota,
                admissionScore,
                admissionMethods
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
            data: transformDataToPastScore(data)
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

const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const normalizeText = (text) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .trim()
        .replace(/[()[\]{}.,;:!?@#$%^&*\-_=+`~'"]/g, '') 
        .replace(/\s+/g, ' '); 
};

const createNameIdMap = (items) => {
    return items.map(item => ({
        name: item.name,
        normalized: normalizeText(item.name),
        id: item._id
    }));
};

const findInMap = (searchName, map) => {
    const searchTerm = normalizeText(searchName);
    
    if (!searchTerm) return null;

    let result = map.find(item => item.normalized === searchTerm);
    if (result) return result;
    
    result = map.find(item => item.normalized.includes(searchTerm) || searchTerm.includes(item.normalized));
    if (result) return result;
    
    const keywords = searchTerm.split(' ').filter(k => k.length > 2);
    for (const keyword of keywords) {
        result = map.find(item => item.normalized.includes(keyword));
        if (result) return result;
    }
    //onsole.log(`No match found for: ${searchName}`);
    return null;
};

export const importFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const records = req.excelData || []; 

        if (records.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid records in Excel file'
            });
        }
        await UniversityMajor.collection.drop();

        const allUniversities = await University.find({}, 'name');

        const allMajors = await Major.find({}, 'name');
        
        const universityMap = createNameIdMap(allUniversities);
        const majorMap = createNameIdMap(allMajors);

        const results = {
            imported: 0,
            skipped: 0,
            errors: []
        };

        for (const record of records) {
            try {
                const majorMatch = findInMap(record.majorGroupName, majorMap);
                const universityMatch = findInMap(record.universityName, universityMap);

                if (!majorMatch) {
                    results.skipped++;
                    results.errors.push(`Major not found: ${record.majorGroupName}`);
                    continue;
                }

                if (!universityMatch) {
                    results.skipped++;
                    results.errors.push(`University not found: ${record.universityName}`);
                    continue;
                }

                const existing = await UniversityMajor.findOne({
                    universityId: universityMatch.id,
                    majorId: majorMatch.id
                });

                if (existing) {
                    const updateData = {
                        tuitionFee: parseFloat(record.tuition) || 0,
                        admissionScore: parseFloat(record.score) || null,
                        admissionMethods: record.subjects ? [record.subjects] : []
                    };
                    
                    await UniversityMajor.findByIdAndUpdate(
                        existing._id,
                        updateData,
                        { new: true }
                    );
                    
                    results.imported++;
                    continue;
                }

                await UniversityMajor.create({
                    universityId: universityMatch.id,
                    majorId: majorMatch.id,
                    majorName: record.majorName,
                    tuitionFee: parseFloat(record.tuition) || 0,
                    duration: 0,
                    quota: 0,
                    admissionScore: parseFloat(record.score) || null,
                    admissionMethods: record.subjects ? [record.subjects] : []
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
