import { ExamResultRepository, MockExamRepository, SubjectCombinationRepository, SubjectRepository } from '../repositories/index.js';

const buildScoreChart = (results) => {
  const buckets = [
    { point: '0-2', count: 0 },
    { point: '2-4', count: 0 },
    { point: '4-6', count: 0 },
    { point: '6-8', count: 0 },
    { point: '8-10', count: 0 },
  ];

  results.forEach((result) => {
    const score = result.scoreTotal;
    if (score < 2) buckets[0].count += 1;
    else if (score < 4) buckets[1].count += 1;
    else if (score < 6) buckets[2].count += 1;
    else if (score < 8) buckets[3].count += 1;
    else buckets[4].count += 1;
  });

  return buckets;
};

class StatsService {
  async getAdminStats() {
    const [totalSubjects, totalSubjectCombinations, totalMockExams, totalExamResults, exams, results] = await Promise.all([
      SubjectRepository.count(),
      SubjectCombinationRepository.count(),
      MockExamRepository.count(),
      ExamResultRepository.count(),
      MockExamRepository.findMany({}, 'questions'),
      ExamResultRepository.findMany({}, 'scoreTotal', { sort: '-takenAt', limit: 1000 }),
    ]);

    const totalQuestions = exams.reduce((sum, exam) => sum + (exam.questions?.length || 0), 0);
    const stats = {
      totalUsers: 0,
      totalUniversities: 0,
      totalUniReps: 0,
      totalSubjects,
      totalSubjectCombinations,
      totalMockExams,
      totalExamResults,
      totalQuestions,
    };

    return {
      stats,
      testResultsData: buildScoreChart(results),
    };
  }
}

export default new StatsService();
