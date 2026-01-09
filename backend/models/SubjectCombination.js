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

subjectCombinationSchema.pre('save', async function() {
    if (!this.subjects || this.subjects.length === 0) {
        throw new Error('Tổ hợp môn phải có ít nhất 1 môn học');
    }
});

const SubjectCombination = mongoose.model('SubjectCombination', subjectCombinationSchema);
export default SubjectCombination;