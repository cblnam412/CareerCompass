import mongoose from 'mongoose';
import UniversityMajorRepository from '../repositories/UniversityMajorRepository.js';
import { HttpError } from '../utils/httpError.js';

const sortRows = (rows, sortBy = 'score-desc') => {
  const sortedRows = [...rows];

  sortedRows.sort((left, right) => {
    if (sortBy === 'score-asc') return left.benchmarkScore - right.benchmarkScore;
    if (sortBy === 'tuition-desc') return right.tuitionFee - left.tuitionFee;
    if (sortBy === 'tuition-asc') return left.tuitionFee - right.tuitionFee;
    return right.benchmarkScore - left.benchmarkScore;
  });

  return sortedRows;
};

const getId = (value) => value?._id?.toString?.() || value?.toString?.() || '';

const getLogoText = (university) => {
  if (!university) return 'UNI';
  if (university.code) return university.code;
  return (university.name || 'UNI')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
};

const normalizeRow = (record) => {
  const item = record?.toObject ? record.toObject() : record;
  const university = item.universityId && typeof item.universityId === 'object' ? item.universityId : {};
  const major = item.majorId && typeof item.majorId === 'object' ? item.majorId : {};
  const universityId = getId(university._id || item.universityId);
  const majorId = getId(major._id || item.majorId);

  return {
    id: getId(item._id),
    universityId,
    majorId,
    majorName: item.majorName || major.name || 'Chua ro nganh',
    universityName: university.name || 'Chua ro truong',
    logo: getLogoText(university),
    location: university.region || university.address || 'Chua cap nhat',
    benchmarkScore: Number(item.admissionScore || 0),
    tuitionFee: Number(item.tuitionFee || 0),
    universityType: item.universityType || 'Cong lap',
    admissionMethods: Array.isArray(item.admissionMethods) ? item.admissionMethods : [],
    isHighest: false,
  };
};

const parseIdList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const assertValidObjectIds = (values, fieldName) => {
  const invalid = values.find((value) => !mongoose.Types.ObjectId.isValid(value));
  if (invalid) throw new HttpError(400, `${fieldName} khong hop le`);
};

class MajorComparisonService {
  async compare(query = {}) {
    const filter = {};
    const universityMajorIds = parseIdList(query.universityMajorIds);
    const universityIds = parseIdList(query.universityIds);

    if (universityMajorIds.length > 0) {
      assertValidObjectIds(universityMajorIds, 'universityMajorIds');
      filter._id = { $in: universityMajorIds };
    }

    if (query.majorId) {
      if (!mongoose.Types.ObjectId.isValid(query.majorId)) throw new HttpError(400, 'majorId khong hop le');
      filter.majorId = query.majorId;
    }

    if (universityIds.length > 0) {
      assertValidObjectIds(universityIds, 'universityIds');
      filter.universityId = { $in: universityIds };
    }

    const limit = Math.min(Number(query.limit) || 12, 50);
    const records = await UniversityMajorRepository.findMany(filter, {
      sort: { admissionScore: -1, tuitionFee: 1 },
      limit,
    });

    const rows = sortRows(records.map(normalizeRow), query.sortBy);
    const highestScore = Math.max(...rows.map((row) => row.benchmarkScore), 0);

    return rows.map((row) => ({
      ...row,
      isHighest: row.benchmarkScore === highestScore && highestScore > 0,
    }));
  }
}

export default new MajorComparisonService();
