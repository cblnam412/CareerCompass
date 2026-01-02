import mongoose  from "mongoose";
const subjectCombinationSchema = new mongoose.Schema({
    combinationName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    subjects: [{
        type: String,
        required: true
    }]
});
const SubjectCombination = mongoose.model('SubjectCombination', subjectCombinationSchema);
export default SubjectCombination;