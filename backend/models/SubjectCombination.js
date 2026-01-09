import mongoose  from "mongoose";
const subjectCombinationSchema = new mongoose.Schema({
    combinationName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    }]
}, {
    timestamps: true
});

subjectCombinationSchema.pre('save', function(next) {
    if (this.subjects && this.subjects.length !== 3) {
        throw new Error('Tổ hợp môn phải gồm đúng 3 môn học');
    }
    next();
});

const SubjectCombination = mongoose.model('SubjectCombination', subjectCombinationSchema);
export default SubjectCombination;