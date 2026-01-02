import mongoose from "mongoose";
import SubjectCombination from "./SubjectCombination";
import { NotBeforeError } from "jsonwebtoken";
const admissionScoreSchema = new mongoose.Schema({
    universityMajorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UniversityMajor',
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    score: {
        type: Number,
        required: true,
    },
    SubjectCombinations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubjectCombination',
        required: true,
    }],
    note: {
        type: String,
    },
}, {
    timestamps: true
});
const AdmissionScore = mongoose.model('AdmissionScore', admissionScoreSchema);
export default AdmissionScore;