import University from '../models/University.js';

export const getAllUniversities = async (req, res) => {
    try {
        const universities = await University.find().select('code fullName -_id').sort({ code: 1 });
        res.status(200).json(universities);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};