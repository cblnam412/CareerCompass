import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: function(v) {
                return v.length === 4;
            },
            message: 'Cần đúng 4 lựa chọn'
        }
    },
    answer: {
        type: String,
        required: true
    }
}, { _id: false });

const mockExamSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true    
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    duration: {
        type: Number,
        required: true
    }, 
    questions: {
        type: [questionSchema],
        required: true,
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: 'Đề thi phải có ít nhất 1 câu hỏi'
        }
    }
}, {
    timestamps: true
});

const MockExam = mongoose.model('MockExam', mockExamSchema);
export default MockExam;