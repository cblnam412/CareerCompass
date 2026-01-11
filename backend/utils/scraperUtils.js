import UniversityMajor from '../models/UniversityMajor.js';
import University from '../models/University.js';
import Major from '../models/Major.js';

export const scrapeAdmissionScores = async (filters = {}) => {
    try {
        console.log('[Scraper] Starting to scrape admission scores...');
        
        const mockData = [
            {
                universityCode: 'BKA',
                universityName: 'Đại học Bách khoa Hà Nội',
                majorCode: 'D000001',
                majorName: 'Công nghệ thông tin',
                admissionScore: 27.5,
                year: 2025,
                method: 'A00'
            },
        ];
        
        return {
            success: true,
            message: 'Mock scrape data prepared',
            data: mockData,
            note: 'Sử dụng mock data. Cần implement real scraper với puppeteer/cheerio để lấy từ vnexpress.net'
        };
    } catch (error) {
        console.error('Scraper error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};


export const bulkUpdateAdmissionScores = async (updates) => {
    try {
        const results = {
            updated: 0,
            failed: 0,
            errors: []
        };

        for (const update of updates) {
            try {
                const query = {};
                
                if (update.universityCode) {
                    const university = await University.findOne({ code: update.universityCode });
                    if (university) query.universityId = university._id;
                }
                
                if (update.majorCode) {
                    const major = await Major.findOne({ code: update.majorCode });
                    if (major) query.majorId = major._id;
                } else if (update.majorName) {
                    query.majorName = update.majorName;
                }
                
                if (Object.keys(query).length === 0) {
                    results.errors.push(`Cannot identify major: ${update.majorName}`);
                    results.failed++;
                    continue;
                }

                const result = await UniversityMajor.findOneAndUpdate(
                    query,
                    {
                        admissionScore: update.admissionScore,
                        admissionScoreYear: update.year || new Date().getFullYear(),
                        updatedAt: new Date()
                    },
                    { new: true }
                );

                if (result) {
                    results.updated++;
                    console.log(`[Scraper] Updated: ${result.majorName} at ${result.universityId}`);
                } else {
                    results.errors.push(`Major not found: ${update.majorName}`);
                    results.failed++;
                }
            } catch (error) {
                results.failed++;
                results.errors.push(`Error updating ${update.majorName}: ${error.message}`);
            }
        }

        return {
            success: true,
            results
        };
    } catch (error) {
        console.error('Bulk update error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export const getOutdatedUniversityMajors = async () => {
    try {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const outdated = await UniversityMajor.find({
            $or: [
                { admissionScore: { $exists: false } },
                { updatedAt: { $lt: oneYearAgo } }
            ]
        })
        .populate('universityId', 'name code')
        .populate('majorId', 'name code')
        .select('majorName admissionScore admissionScoreYear updatedAt universityId majorId');

        return {
            success: true,
            count: outdated.length,
            data: outdated
        };
    } catch (error) {
        console.error('Error fetching outdated majors:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export const updateAdmissionScore = async (universityMajorId, admissionScore, year) => {
    try {
        const updated = await UniversityMajor.findByIdAndUpdate(
            universityMajorId,
            {
                admissionScore,
                admissionScoreYear: year || new Date().getFullYear(),
                updatedAt: new Date()
            },
            { new: true }
        ).populate('universityId majorId');

        if (!updated) {
            return {
                success: false,
                error: 'UniversityMajor not found'
            };
        }

        return {
            success: true,
            data: updated
        };
    } catch (error) {
        console.error('Update score error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
