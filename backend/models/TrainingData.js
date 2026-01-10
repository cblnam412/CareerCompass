import mongoose from "mongoose";

const trainingDataSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    
    externalDataId: {
        type: String,
        sparse: true,  
    },
    
    dataSourceType: {
        type: String,
        enum: ['internal_student', 'external_open_source', 'imported_dataset'],
        default: 'internal_student',
    },
    
    dataSourceName: {
        type: String, 
    },
    
    mbtiType: {
        type: String,
        enum: ['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 
               'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'],
    },
    
    hollandCode: {
        realistic: { type: Number, min: 0, max: 100 },      
        investigative: { type: Number, min: 0, max: 100 },  
        artistic: { type: Number, min: 0, max: 100 },       
        social: { type: Number, min: 0, max: 100 },         
        enterprising: { type: Number, min: 0, max: 100 },  
        conventional: { type: Number, min: 0, max: 100 },  
    },
    
    subjectScores: {
        type: Map,
        of: {
            type: Number,
            min: 0,
            max: 10
        }
    },
    
    gpa: {
        type: Number,
        min: 0,
        max: 10,
    },
    
    softSkills: {
        type: Map,
        of: {
            type: Number,
            min: 0,
            max: 1,
            enum: [0, 1]
        }
    },
    
    interests: [String],
    careerGoals: String,
    learningStyle: {
        type: String,
        enum: ['visual', 'auditory', 'reading/writing', 'kinesthetic'],
    },
    
    recommendedMajors: [{
        majorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Major',
        },
        matchScore: {
            type: Number,
            min: 0,
            max: 100,
        },
        reason: String, 
        isPrimary: {
            type: Boolean,
            default: false,
        },
    }],
    
    actualMajorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Major',
    },
    
    majorMappingConfidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 1.0,
    },
    
    completenessScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    dataSource: {
        type: String,
        enum: ['quiz_result', 'exam_result', 'student_input', 'combined'],
        default: 'combined',
    },
    
    isValid: {
        type: Boolean,
        default: true,
    },
    validationErrors: [String],
    usedForTraining: {
        type: Boolean,
        default: false,
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true
});

trainingDataSchema.index({ studentId: 1, usedForTraining: 1 });
trainingDataSchema.index({ createdAt: -1 });
trainingDataSchema.index({ isValid: 1, usedForTraining: 1 });

const TrainingData = mongoose.model('TrainingData', trainingDataSchema);
export default TrainingData;
