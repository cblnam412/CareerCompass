import mongoose from 'mongoose';
import { getAllSubjects, getInternalStudentExamResults, getSubjectById } from '../clients/mockExamsServiceClient.js';
import { StudentProfileRepository, StudentSubjectScoreRepository } from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';

const toId = (value) => value?._id?.toString?.() || value?.toString?.() || value;
const roundScore = (value) => Math.round(Number(value) * 100) / 100;

const assertObjectId = (value, name) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new HttpError(400, `${name} khong hop le`);
  }
};

class StudentSubjectScoreService {
  async syncTranscriptScore(studentId, subjectId, score) {
    const existingProfile = await StudentProfileRepository.findByUserId(studentId);
    const merged = new Map(
      (existingProfile?.academicTranscript || [])
        .filter((item) => item?.subjectId)
        .map((item) => [toId(item.subjectId), { subjectId: item.subjectId, score: item.score }]),
    );

    merged.set(String(subjectId), { subjectId, score });

    return StudentProfileRepository.updateByUserId(
      studentId,
      {
        userId: studentId,
        academicTranscript: [...merged.values()],
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  assertSameStudent(requester, studentId, action = 'cap nhat') {
    if (String(requester.userId) !== String(studentId)) {
      throw new HttpError(403, `Ban khong co quyen ${action} diem cua hoc sinh khac`);
    }
  }

  async getAllScores(studentId, query = {}) {
    assertObjectId(studentId, 'studentId');

    const [subjects, scores] = await Promise.all([
      getAllSubjects(),
      StudentSubjectScoreRepository.findByStudent(studentId),
    ]);
    const scoreMap = new Map(scores.map((score) => [String(score.subjectId), score]));

    let data = subjects.map((subject) => {
      const saved = scoreMap.get(String(subject._id));
      return {
        _id: saved?._id,
        subjectId: subject._id,
        subjectName: subject.name,
        score: saved?.score || 0,
        examCount: saved?.examCount || 0,
        totalScore: saved?.totalScore || 0,
        updatedAt: saved?.updatedAt,
      };
    });

    if (query.search) {
      const needle = query.search.toLowerCase();
      data = data.filter((item) => item.subjectName?.toLowerCase().includes(needle));
    }

    return data;
  }

  async getSubjectScore(studentId, subjectId) {
    assertObjectId(studentId, 'studentId');
    assertObjectId(subjectId, 'subjectId');

    const [subject, saved] = await Promise.all([
      getSubjectById(subjectId),
      StudentSubjectScoreRepository.findOneLean(studentId, subjectId),
    ]);

    return {
      _id: saved?._id,
      studentId,
      subjectId: subject,
      subjectName: subject.name,
      score: saved?.score || 0,
      examCount: saved?.examCount || 0,
      totalScore: saved?.totalScore || 0,
      updatedAt: saved?.updatedAt,
    };
  }

  async addOrUpdateManualScore(studentId, payload, requester) {
    this.assertSameStudent(requester, studentId, 'cap nhat');
    assertObjectId(studentId, 'studentId');

    const { subjectId, score } = payload;
    const subject = await getSubjectById(subjectId);
    const existing = await StudentSubjectScoreRepository.findOneLean(studentId, subjectId);
    const examCount = existing?.examCount > 0 ? existing.examCount : 1;
    const totalScore = roundScore(score * examCount);

    const saved = await StudentSubjectScoreRepository.upsert(studentId, subjectId, {
      score: roundScore(score),
      examCount,
      totalScore,
    });
    await this.syncTranscriptScore(studentId, subjectId, saved.score);

    return {
      subjectName: subject.name,
      subjectId: subject._id,
      score: saved.score,
      examCount: saved.examCount,
      totalScore: saved.totalScore,
    };
  }

  async deleteSubjectScore(studentId, subjectId, requester) {
    this.assertSameStudent(requester, studentId, 'xoa');
    assertObjectId(studentId, 'studentId');
    assertObjectId(subjectId, 'subjectId');

    const deleted = await StudentSubjectScoreRepository.deleteOne(studentId, subjectId);
    if (!deleted) throw new HttpError(404, 'Diem mon hoc nay khong ton tai');
    return deleted;
  }

  async updateScoreAfterExam(studentId, subjectId, score) {
    assertObjectId(studentId, 'studentId');
    assertObjectId(subjectId, 'subjectId');

    const numericScore = Number(score);
    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
      throw new HttpError(400, 'Diem phai nam trong khoang 0-10');
    }

    await getSubjectById(subjectId);
    const existing = await StudentSubjectScoreRepository.findOneLean(studentId, subjectId);
    const examCount = (existing?.examCount || 0) + 1;
    const totalScore = roundScore((existing?.totalScore || 0) + numericScore);
    const average = roundScore(totalScore / examCount);

    const saved = await StudentSubjectScoreRepository.upsert(studentId, subjectId, {
      score: average,
      examCount,
      totalScore,
    });
    await this.syncTranscriptScore(studentId, subjectId, saved.score);
    return saved;
  }

  async recalculateStudentScores(studentId) {
    assertObjectId(studentId, 'studentId');

    const results = await getInternalStudentExamResults(studentId);
    const grouped = new Map();

    results.forEach((result) => {
      const subjectId = toId(result.subject);
      if (!subjectId || result.scoreTotal === undefined) return;
      const current = grouped.get(subjectId) || { totalScore: 0, examCount: 0 };
      current.totalScore += Number(result.scoreTotal);
      current.examCount += 1;
      grouped.set(subjectId, current);
    });

    const updated = [];
    for (const [subjectId, value] of grouped.entries()) {
      const totalScore = roundScore(value.totalScore);
      const saved = await StudentSubjectScoreRepository.upsert(studentId, subjectId, {
        totalScore,
        examCount: value.examCount,
        score: roundScore(totalScore / value.examCount),
      });
      await this.syncTranscriptScore(studentId, subjectId, saved.score);
      updated.push(saved);
    }

    return {
      updatedCount: updated.length,
      data: updated,
    };
  }
}

export default new StudentSubjectScoreService();
