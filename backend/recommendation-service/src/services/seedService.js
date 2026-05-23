import CareerKnowledge from '../models/CareerKnowledge.js';
import RecommendationTrainingSample from '../models/RecommendationTrainingSample.js';
import { careerKnowledgeSeed } from '../data/careerKnowledgeSeed.js';

const createTrainingSamples = (knowledge) => {
  const demand = Number(knowledge.demandScore || 60);
  const salary = Number(knowledge.salaryLevel || 60);
  const basePositive = [90, 88, 84, 78, 82, 72, 60, demand, salary];
  const baseMedium = [65, 60, 70, 55, 45, 68, 60, demand, salary];
  const baseLow = [30, 35, 48, 35, 20, 52, 45, demand, salary];

  return [
    { majorName: knowledge.majorName, features: basePositive, label: Math.min(100, 70 + demand * 0.15 + salary * 0.1), source: 'seed' },
    { majorName: knowledge.majorName, features: baseMedium, label: Math.min(85, 48 + demand * 0.12 + salary * 0.08), source: 'seed' },
    { majorName: knowledge.majorName, features: baseLow, label: Math.max(15, 25 + demand * 0.08 + salary * 0.04), source: 'seed' },
    { majorName: knowledge.majorName, features: [95, 45, 88, 45, 75, 80, 60, demand, salary], label: 78, source: 'seed' },
    { majorName: knowledge.majorName, features: [45, 92, 62, 80, 70, 70, 60, demand, salary], label: 74, source: 'seed' },
  ];
};

class SeedService {
  async seedDefaults() {
    const existingKnowledge = await CareerKnowledge.countDocuments();
    if (existingKnowledge === 0) {
      await CareerKnowledge.insertMany(careerKnowledgeSeed, { ordered: false });
      console.log(`Seeded ${careerKnowledgeSeed.length} career knowledge records`);
    }

    const existingSamples = await RecommendationTrainingSample.countDocuments({ source: 'seed' });
    if (existingSamples === 0) {
      const source = await CareerKnowledge.find({ status: 'active' }).lean();
      const samples = source.flatMap(createTrainingSamples);
      await RecommendationTrainingSample.insertMany(samples, { ordered: false });
      console.log(`Seeded ${samples.length} recommendation training samples`);
    }

    return {
      careerKnowledge: await CareerKnowledge.countDocuments(),
      trainingSamples: await RecommendationTrainingSample.countDocuments(),
    };
  }
}

export default new SeedService();
