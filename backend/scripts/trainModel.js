import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { MajorRecommendationModel } from '../utils/mlModel.js';
import { 
    prepareTrainingDataset, 
    trainTestSplit, 
    markDataAsUsedForTraining,
    getFeatureNames
} from '../utils/trainingDataUtils.js';
import ModelVersion from '../models/ModelVersion.js';
import Major from '../models/Major.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODELS_DIR = path.join(__dirname, '../models_ml');


function createConfusionMatrix(yTrue, yPred, classes) {
    const matrix = {};
    classes.forEach(cls => {
        matrix[cls] = {};
        classes.forEach(cls2 => {
            matrix[cls][cls2] = 0;
        });
    });
    
    yTrue.forEach((true_label, i) => {
        const pred_label = yPred[i];
        matrix[true_label][pred_label]++;
    });
    
    return matrix;
}

function calculateMetrics(yTrue, yPred, classes) {
    const metrics = {};
    
    classes.forEach(majorId => {
        let tp = 0, fp = 0, fn = 0, tn = 0;
        
        yTrue.forEach((true_label, i) => {
            const pred_label = yPred[i];
            
            if (true_label === majorId && pred_label === majorId) {
                tp++;
            } else if (true_label !== majorId && pred_label === majorId) {
                fp++;
            } else if (true_label === majorId && pred_label !== majorId) {
                fn++;
            } else {
                tn++;
            }
        });
        
        const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
        const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
        const f1 = precision + recall === 0 ? 0 : 2 * (precision * recall) / (precision + recall);
        
        metrics[majorId] = {
            tp, fp, fn, tn,
            precision: parseFloat((precision * 100).toFixed(2)),
            recall: parseFloat((recall * 100).toFixed(2)),
            f1: parseFloat((f1 * 100).toFixed(2))
        };
    });
    
    return metrics;
}

async function getMajorNames() {
    try {
        const majors = await Major.find().select('_id name category');
        const nameMap = {};
        majors.forEach(m => {
            nameMap[m._id.toString()] = { name: m.name, category: m.category };
        });
        return nameMap;
    } catch (error) {
        console.error('Error getting major names:', error);
        return {};
    }
}

async function trainMajorRecommendationModel() {
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('🚀 BẮT ĐẦU TRAINING MÔ HÌNH ĐÁNH GIÁ NGÀNH PHÙ HỢP');
    console.log('═'.repeat(60));
    console.log();
    
    try {
        console.log('📊 Đang kết nối tới database...');
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGODB_URI);
        }
        console.log('✅ Kết nối database thành công\n');
        
        console.log('📥 Đang chuẩn bị dataset...');
        const datasetResult = await prepareTrainingDataset();
        
        if (!datasetResult.success) {
            console.error('❌ Chuẩn bị dataset thất bại:', datasetResult.error);
            process.exit(1);
        }
        
        const { dataset, samplesCount, featureNames, featureCount } = datasetResult;
        
        console.log('✅ Dataset đã sẵn sàng');
        console.log(`   • Tổng số mẫu: ${samplesCount}`);
        console.log(`   • Số features: ${featureCount}`);
        console.log(`   • Số lớp (ngành): ${new Set(dataset.y).size}`);
        console.log();
        
        if (samplesCount < 20) {
            console.warn('⚠️  Cảnh báo: Số mẫu quá ít, kết quả có thể không chính xác');
        }
        
        console.log('📂 Đang chia dataset...');
        const { train, test } = trainTestSplit(dataset, 0.2);
        console.log('✅ Chia dataset thành công');
        console.log(`   • Training: ${train.X.length} mẫu`);
        console.log(`   • Testing: ${test.X.length} mẫu`);
        console.log(`   • Tỉ lệ: 80% / 20%\n`);
        
        const majorNames = await getMajorNames();
        
        console.log('🤖 Đang training Random Forest model...');
        const model = new MajorRecommendationModel();
        const trainResult = model.train(train.X, train.y, featureNames);
        
        if (!trainResult.success) {
            console.error('❌ Training thất bại:', trainResult.error);
            process.exit(1);
        }
        
        console.log('✅ Training hoàn thành');
        console.log(`   • Accuracy: ${(trainResult.accuracy * 100).toFixed(2)}%`);
        console.log(`   • Số cây (trees): ${trainResult.nEstimators}`);
        console.log(`   • Max depth: 15\n`);
        
        console.log('📈 Đang đánh giá trên test set...');
        const testPreds = model.model.predict(test.X);
        const testAccuracy = test.X.length > 0 ? 
            testPreds.filter((pred, i) => pred === test.y[i]).length / test.X.length : 0;
        
        console.log(`✅ Test Accuracy: ${(testAccuracy * 100).toFixed(2)}%\n`);
        
        console.log('📊 Hiệu suất theo từng ngành:');
        const metrics = calculateMetrics(test.y, testPreds, model.classes);
        const confusionMatrix = createConfusionMatrix(test.y, testPreds, model.classes);
        
        let avgPrecision = 0, avgRecall = 0, avgF1 = 0;
        Object.entries(metrics).forEach(([majorId, m]) => {
            const majorInfo = majorNames[majorId];
            const name = majorInfo ? majorInfo.name : majorId;
            
            console.log(`   📌 ${name}:`);
            console.log(`      • Precision: ${m.precision}%`);
            console.log(`      • Recall: ${m.recall}%`);
            console.log(`      • F1-Score: ${m.f1}%`);
            
            avgPrecision += m.precision;
            avgRecall += m.recall;
            avgF1 += m.f1;
        });
        console.log();
        
        const numClasses = model.classes.length;
        avgPrecision /= numClasses;
        avgRecall /= numClasses;
        avgF1 /= numClasses;
        
        console.log('🎯 Top 10 Features quan trọng nhất:');
        const importances = model.getFeatureImportance();
        importances.slice(0, 10).forEach((item, idx) => {
            console.log(`   ${idx + 1}. ${item.feature}: ${item.importance}%`);
        });
        console.log();
        
        console.log('💾 Đang lưu model...');
        if (!fs.existsSync(MODELS_DIR)) {
            fs.mkdirSync(MODELS_DIR, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const modelFilename = `major_recommendation_model_${timestamp}.json`;
        const modelPath = path.join(MODELS_DIR, modelFilename);
        
        const modelJSON = model.toJSON();
        fs.writeFileSync(modelPath, JSON.stringify(modelJSON, null, 2));
        console.log(`✅ Model đã lưu: ${modelFilename}\n`);
        
        console.log('📝 Đang lưu model version vào database...');
        const version = await ModelVersion.countDocuments() + 1;
        
        await ModelVersion.updateMany({ isActive: true }, { isActive: false });
        
        const modelVersion = new ModelVersion({
            version,
            modelType: 'random_forest',
            trainingConfig: {
                totalSamples: samplesCount,
                trainTestSplit: 0.8,
                features: featureNames,
                hyperparameters: {
                    nEstimators: 20,
                    maxDepth: 15,
                    minSamplesSplit: 2,
                    minSamplesLeaf: 1
                }
            },
            performanceMetrics: {
                accuracy: trainResult.accuracy,
                precision: avgPrecision,
                recall: avgRecall,
                f1Score: avgF1,
                auc: 0, 
                confusionMatrix,
                classificationReport: metrics
            },
            modelPath,
            isActive: true,
            trainingLogs: [
                `Bắt đầu training: ${new Date().toISOString()}`,
                `Tổng mẫu: ${samplesCount}`,
                `Mẫu training: ${train.X.length}`,
                `Mẫu testing: ${test.X.length}`,
                `Training accuracy: ${(trainResult.accuracy * 100).toFixed(2)}%`,
                `Test accuracy: ${(testAccuracy * 100).toFixed(2)}%`,
                `Hoàn thành: ${new Date().toISOString()}`
            ],
            featureImportance: importances.reduce((obj, item) => {
                obj[item.feature] = item.importance;
                return obj;
            }, {}),
            notes: `Random Forest với ${samplesCount} mẫu training. Test accuracy: ${(testAccuracy * 100).toFixed(2)}%`
        });
        
        await modelVersion.save();
        console.log(`✅ Model version ${version} đã lưu vào database\n`);
        
        console.log('🔄 Đánh dấu dữ liệu đã được sử dụng cho training...');
        const trainDataIds = train.rawData.map(d => d._id);
        const markResult = await markDataAsUsedForTraining(trainDataIds);
        if (markResult.success) {
            console.log(`✅ Đã đánh dấu ${markResult.modifiedCount} mẫu\n`);
        }
        
        console.log('═'.repeat(60));
        console.log('✅ TRAINING HOÀN THÀNH THÀNH CÔNG');
        console.log('═'.repeat(60));
        console.log(`📌 Phiên bản model: ${version}`);
        console.log(`📌 Loại model: Random Forest`);
        console.log(`📌 Số cây: 20`);
        console.log(`📌 Training accuracy: ${(trainResult.accuracy * 100).toFixed(2)}%`);
        console.log(`📌 Test accuracy: ${(testAccuracy * 100).toFixed(2)}%`);
        console.log(`📌 Average F1-Score: ${avgF1.toFixed(2)}%`);
        console.log(`📌 Số mẫu training: ${samplesCount}`);
        console.log(`📌 Số features: ${featureCount}`);
        console.log(`📌 Số lớp: ${model.classes.length}`);
        console.log(`📌 File model: ${modelFilename}`);
        console.log('═'.repeat(60));
        console.log();
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi trong quá trình training:', error);
        process.exit(1);
    }
}

trainMajorRecommendationModel().catch(error => {
    console.error('❌ Lỗi nghiêm trọng:', error);
    process.exit(1);
});
