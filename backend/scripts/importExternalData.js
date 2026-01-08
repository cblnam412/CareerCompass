import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TrainingData from '../models/TrainingData.js';
import {
    calculateCompletenessScore,
    validateTrainingData
} from '../utils/trainingDataUtils.js';

dotenv.config();

const careerKuultureData = [
    {
        externalDataId: 'careerKuulture_001',
        dataSourceName: 'CareerKuulture Dataset',
        mbtiType: 'INTJ',
        mbtiScores: { extroversion: 25, sensing: 20, thinking: 85, judging: 90 },
        hollandCode: { investigative: 95, realistic: 65, conventional: 55 },
        subjectScores: {
            math: 9.5, physics: 9, chemistry: 8.5, biology: 7,
            literature: 6, history: 5.5, geography: 6, civic: 6.5, english: 8
        },
        gpa: 8.6,
        softSkills: {
            communication: 6, problemSolving: 9.5, teamwork: 6,
            leadership: 8.5, creativity: 8, timeManagement: 8.5
        },
        recommendedMajors: [
            { majorId: '65f1234567890abcdef12340', matchScore: 95, reason: 'Analytical & Strategic' },
            { majorId: '65f1234567890abcdef12341', matchScore: 85, reason: 'Technical Focus' }
        ]
    },
    {
        externalDataId: 'careerKuulture_002',
        dataSourceName: 'CareerKuulture Dataset',
        mbtiType: 'ESFP',
        mbtiScores: { extroversion: 95, sensing: 85, thinking: 30, judging: 25 },
        hollandCode: { social: 90, enterprising: 80, artistic: 70 },
        subjectScores: {
            math: 6.5, physics: 5.5, chemistry: 6, biology: 7,
            literature: 8, history: 7.5, geography: 7, civic: 7.5, english: 8.5
        },
        gpa: 7.2,
        softSkills: {
            communication: 9.5, problemSolving: 6, teamwork: 9,
            leadership: 8, creativity: 8.5, timeManagement: 6
        },
        recommendedMajors: [
            { majorId: '65f1234567890abcdef12342', matchScore: 90, reason: 'People-oriented' },
            { majorId: '65f1234567890abcdef12343', matchScore: 85, reason: 'Creative Expression' }
        ]
    },
    {
        externalDataId: 'careerKuulture_003',
        dataSourceName: 'CareerKuulture Dataset',
        mbtiType: 'ISTJ',
        mbtiScores: { extroversion: 20, sensing: 90, thinking: 80, judging: 95 },
        hollandCode: { conventional: 95, realistic: 75, investigative: 60 },
        subjectScores: {
            math: 8.5, physics: 8, chemistry: 7.5, biology: 6.5,
            literature: 6, history: 6, geography: 6.5, civic: 8, english: 7
        },
        gpa: 8.1,
        softSkills: {
            communication: 6, problemSolving: 7.5, teamwork: 7,
            leadership: 7, creativity: 5.5, timeManagement: 9.5
        },
        recommendedMajors: [
            { majorId: '65f1234567890abcdef12344', matchScore: 92, reason: 'Structured & Organized' },
            { majorId: '65f1234567890abcdef12345', matchScore: 88, reason: 'Administrative Focus' }
        ]
    }
];

const onetData = [
    {
        externalDataId: 'onet_software_engineer_001',
        dataSourceName: 'O*NET Database - Software Engineer',
        mbtiType: 'INTP',
        mbtiScores: { extroversion: 15, sensing: 35, thinking: 90, judging: 45 },
        hollandCode: { investigative: 95, realistic: 75, conventional: 60 },
        subjectScores: {
            math: 9.5, physics: 9, chemistry: 7.5, biology: 5,
            literature: 5, history: 4.5, geography: 5.5, civic: 5.5, english: 7
        },
        gpa: 8.8,
        softSkills: {
            communication: 5, problemSolving: 9.5, teamwork: 6,
            leadership: 5.5, creativity: 8.5, timeManagement: 7
        },
        recommendedMajors: [
            { majorId: '65f1234567890abcdef12346', matchScore: 96, reason: 'Technical Excellence' }
        ]
    },
    {
        externalDataId: 'onet_healthcare_001',
        dataSourceName: 'O*NET Database - Healthcare Professional',
        mbtiType: 'ISFJ',
        mbtiScores: { extroversion: 50, sensing: 80, thinking: 45, judging: 85 },
        hollandCode: { social: 95, realistic: 70, conventional: 70 },
        subjectScores: {
            math: 7.5, physics: 7, chemistry: 8.5, biology: 9.5,
            literature: 7, history: 6.5, geography: 6.5, civic: 7.5, english: 7.5
        },
        gpa: 8.3,
        softSkills: {
            communication: 8.5, problemSolving: 7.5, teamwork: 9,
            leadership: 7, creativity: 6, timeManagement: 8.5
        },
        recommendedMajors: [
            { majorId: '65f1234567890abcdef12347', matchScore: 94, reason: 'Care & Service Focus' }
        ]
    }
];

async function importExternalData() {
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📥 IMPORTING EXTERNAL TRAINING DATA');
    console.log('═'.repeat(60));
    console.log();
    
    try {
        console.log('📊 Connecting to database...');
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGODB_URI);
        }
        console.log('✅ Database connected\n');
        
        const allExternalData = [...careerKuultureData, ...onetData];
        
        console.log(`📥 Importing ${allExternalData.length} records from external sources...\n`);
        
        let successCount = 0;
        let failedCount = 0;
        const errors = [];
        
        for (const record of allExternalData) {
            try {
                const trainingData = new TrainingData({
                    externalDataId: record.externalDataId,
                    dataSourceType: 'external_open_source',
                    dataSourceName: record.dataSourceName,
                    mbtiType: record.mbtiType,
                    mbtiScores: record.mbtiScores,
                    hollandCode: record.hollandCode,
                    subjectScores: record.subjectScores,
                    gpa: record.gpa,
                    softSkills: record.softSkills,
                    recommendedMajors: record.recommendedMajors,
                    isValid: true
                });
                
                const validation = validateTrainingData(trainingData);
                if (!validation.isValid) {
                    trainingData.isValid = false;
                    trainingData.validationErrors = validation.errors;
                }
                
                trainingData.completenessScore = calculateCompletenessScore(trainingData);
                
                await trainingData.save();
                
                console.log(`✅ Imported: ${record.externalDataId} (${record.dataSourceName})`);
                successCount++;
            } catch (error) {
                console.error(`❌ Failed: ${record.externalDataId} - ${error.message}`);
                failedCount++;
                errors.push({
                    id: record.externalDataId,
                    error: error.message
                });
            }
        }
        
        console.log();
        console.log('═'.repeat(60));
        console.log('✅ IMPORT COMPLETED');
        console.log('═'.repeat(60));
        console.log(`✅ Success: ${successCount}`);
        console.log(`❌ Failed: ${failedCount}`);
        console.log(`📊 Total: ${successCount + failedCount}`);
        
        if (errors.length > 0) {
            console.log('\nErrors:');
            errors.forEach(err => {
                console.log(`  • ${err.id}: ${err.error}`);
            });
        }
        
        console.log('\n📈 Training Data Statistics:');
        const totalTrainingData = await TrainingData.countDocuments();
        const externalTrainingData = await TrainingData.countDocuments({ 
            dataSourceType: 'external_open_source' 
        });
        const internalTrainingData = await TrainingData.countDocuments({ 
            dataSourceType: 'internal_student' 
        });
        
        console.log(`  • Total: ${totalTrainingData}`);
        console.log(`  • External: ${externalTrainingData}`);
        console.log(`  • Internal: ${internalTrainingData}`);
        
        const bySource = await TrainingData.aggregate([
            {
                $group: {
                    _id: '$dataSourceName',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        if (bySource.length > 0) {
            console.log('\n📊 By Source:');
            bySource.forEach(source => {
                console.log(`  • ${source._id || 'Unknown'}: ${source.count}`);
            });
        }
        
        console.log();
        console.log('═'.repeat(60));
        console.log();
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error importing external data:', error);
        process.exit(1);
    }
}

importExternalData().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
