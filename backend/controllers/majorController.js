// backend/controllers/majorController.js
import Major from '../models/Major.js';
import University from '../models/University.js';

// 1. API Lọc và hiển thị danh sách (Chỉ year 2025)
export const getFilteredMajors = async (req, res) => {
    try {
        const { 
            universityCode, 
            minTuition,     
            maxTuition,    
            minScore,      
            maxScore       
        } = req.query;

        let query = { year: 2025 };

        if (universityCode) {
            query.universityCode = universityCode.toUpperCase();
        }

        if (minTuition || maxTuition) {
            query.tuitionFee = {};
            if (minTuition) query.tuitionFee.$gte = Number(minTuition);
            if (maxTuition) query.tuitionFee.$lte = Number(maxTuition);
        }

        if (minScore || maxScore) {
            query.admissionScore = {};
            if (minScore) query.admissionScore.$gte = Number(minScore);
            if (maxScore) query.admissionScore.$lte = Number(maxScore);
        }

        const majors = await Major.find(query)
            .populate({
                path: 'university',
                select: 'fullName -_id' 
            })
            .select('majorCode name admissionScore subjectGroups universityCode tuitionFee');

        const formattedMajors = majors.map(major => ({
            universityName: major.university ? major.university.fullName : "Chưa cập nhật",
            universityCode: major.universityCode,
            majorCode: major.majorCode,
            majorName: major.name,
            admissionScore2025: major.admissionScore,
            subjectGroups: major.subjectGroups,
            tuitionFee: major.tuitionFee
        }));

        res.status(200).json({
            count: formattedMajors.length,
            data: formattedMajors
        });

    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

export const getMajorDetail = async (req, res) => {
    try {
        const { universityCode, majorCode } = req.params;

        const majorHistory = await Major.find({
            universityCode: universityCode.toUpperCase(),
            majorCode: majorCode
        })
        .populate('university', 'fullName address website phone1') 
        .sort({ year: -1 });

        if (!majorHistory || majorHistory.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy ngành này." });
        }

        const generalInfo = majorHistory[0].university;

        res.status(200).json({
            universityInfo: generalInfo,
            majorCode: majorCode,
            majorName: majorHistory[0].name,
            history: majorHistory.map(item => ({
                year: item.year,
                admissionScore: item.admissionScore,
                tuitionFee: item.tuitionFee,
                subjectGroups: item.subjectGroups
            }))
        });

    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};