import fs from 'fs/promises';
import UniversityMajorRepository from '../repositories/UniversityMajorRepository.js';
import UniversityRepository from '../repositories/UniversityRepository.js';
import MajorRepository from '../repositories/MajorRepository.js';
import { escapeRegex, getPagination, normalizeText } from '../utils/query.js';
import { HttpError } from '../utils/httpError.js';

const withPastScore = (record) => {
  if (Array.isArray(record)) return record.map(withPastScore);
  const item = record?.toObject ? record.toObject() : record;
  return item ? { ...item, pastScore: item.admissionScore } : item;
};

const toNumberOrDefault = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toScore = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const toMethods = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [String(value)];
};

const createNameMap = (items) =>
  items.map((item) => ({ id: item._id, name: item.name, normalized: normalizeText(item.name) }));

const findInMap = (value, map) => {
  const search = normalizeText(value);
  if (!search) return null;
  return (
    map.find((item) => item.normalized === search) ||
    map.find((item) => item.normalized.includes(search) || search.includes(item.normalized)) ||
    search
      .split(' ')
      .filter((word) => word.length > 2)
      .map((word) => map.find((item) => item.normalized.includes(word)))
      .find(Boolean) ||
    null
  );
};

class UniversityMajorService {
  async getAll(query) {
    const { page, limit, skip } = getPagination(query, 20);
    const filter = {};
    if (query.majorId) filter.majorId = query.majorId;
    if (query.universityId) filter.universityId = query.universityId;
    if (query.search) filter.majorName = { $regex: escapeRegex(query.search), $options: 'i' };

    const [data, total] = await Promise.all([
      UniversityMajorRepository.findMany(filter, { sort: { createdAt: -1 }, skip, limit }),
      UniversityMajorRepository.count(filter),
    ]);

    return {
      data: withPastScore(data),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getById(id) {
    const record = await UniversityMajorRepository.findByIdPopulated(id);
    if (!record) throw new HttpError(404, 'Không tìm thấy quan hệ trường-ngành');
    return withPastScore(record);
  }

  async getByUniversity(universityId, query) {
    const university = await UniversityRepository.findById(universityId);
    if (!university) throw new HttpError(404, 'Không tìm thấy trường đại học');

    const { page, limit, skip } = getPagination(query, 20);
    const filter = { universityId };
    if (query.search) filter.majorName = { $regex: escapeRegex(query.search), $options: 'i' };

    const [data, total] = await Promise.all([
      UniversityMajorRepository.findMany(filter, { sort: { createdAt: -1 }, skip, limit }),
      UniversityMajorRepository.count(filter),
    ]);

    return {
      data: withPastScore(data),
      university: { id: university._id, name: university.name, code: university.code },
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async create(payload) {
    const { universityId, majorId, majorName } = payload;
    if (!universityId || !majorId || !majorName) {
      throw new HttpError(400, 'universityId, majorId và majorName là bắt buộc');
    }

    const [university, major] = await Promise.all([
      UniversityRepository.findById(universityId),
      MajorRepository.findById(majorId),
    ]);
    if (!university || !major) throw new HttpError(404, 'Không tìm thấy trường hoặc ngành học');

    if (await UniversityMajorRepository.findDuplicate(universityId, majorId)) {
      throw new HttpError(409, 'Quan hệ trường-ngành này đã tồn tại');
    }

    const record = await UniversityMajorRepository.create({
      universityId,
      majorId,
      majorName: majorName.trim(),
      tuitionFee: toNumberOrDefault(payload.tuitionFee),
      duration: payload.duration ?? 0,
      quota: toNumberOrDefault(payload.quota),
      admissionScore: toScore(payload.admissionScore),
      admissionMethods: toMethods(payload.admissionMethods),
    });

    return this.getById(record._id);
  }

  async update(id, payload) {
    const allowed = ['majorName', 'tuitionFee', 'duration', 'quota', 'admissionMethods', 'admissionScore'];
    const data = {};
    allowed.forEach((field) => {
      if (payload[field] !== undefined) data[field] = payload[field];
    });
    if (data.majorName) data.majorName = data.majorName.trim();
    if (data.tuitionFee !== undefined) data.tuitionFee = toNumberOrDefault(data.tuitionFee);
    if (data.quota !== undefined) data.quota = toNumberOrDefault(data.quota);
    if (data.admissionScore !== undefined) data.admissionScore = toScore(data.admissionScore);
    if (data.admissionMethods !== undefined) data.admissionMethods = toMethods(data.admissionMethods);

    const record = await UniversityMajorRepository.updateById(id, data);
    if (!record) throw new HttpError(404, 'Không tìm thấy quan hệ trường-ngành');
    return withPastScore(record);
  }

  async delete(id) {
    const record = await UniversityMajorRepository.deleteById(id);
    if (!record) throw new HttpError(404, 'Không tìm thấy quan hệ trường-ngành');
    return record;
  }

  async importFromExcel(filePath, records = []) {
    try {
      if (records.length === 0) throw new HttpError(400, 'Không có dữ liệu hợp lệ trong file Excel');

      await UniversityMajorRepository.deleteAll();

      const [universities, majors] = await Promise.all([
        UniversityRepository.findMany({}, 'name'),
        MajorRepository.findMany({}, { projection: 'name' }),
      ]);
      const universityMap = createNameMap(universities);
      const majorMap = createNameMap(majors);
      const results = { imported: 0, skipped: 0, errors: [] };

      for (const record of records) {
        const universityMatch = findInMap(record.universityName, universityMap);
        const majorMatch = findInMap(record.majorGroupName || record.majorName, majorMap);

        if (!universityMatch) {
          results.skipped += 1;
          results.errors.push(`Không tìm thấy trường: ${record.universityName}`);
          continue;
        }
        if (!majorMatch) {
          results.skipped += 1;
          results.errors.push(`Không tìm thấy ngành: ${record.majorGroupName || record.majorName}`);
          continue;
        }

        await UniversityMajorRepository.create({
          universityId: universityMatch.id,
          majorId: majorMatch.id,
          majorName: record.majorName || majorMatch.name,
          tuitionFee: toNumberOrDefault(record.tuition),
          duration: 0,
          quota: 0,
          admissionScore: toScore(record.score),
          admissionMethods: toMethods(record.subjects),
        });
        results.imported += 1;
      }

      return results;
    } finally {
      await fs.rm(filePath, { force: true }).catch(() => {});
    }
  }

  getAdminList(query) {
    return this.getAll(query);
  }

  async getOutdated(query) {
    const { page, limit, skip } = getPagination(query, 20);
    const filter = { $or: [{ admissionScore: null }, { admissionScore: { $exists: false } }] };
    const [data, total] = await Promise.all([
      UniversityMajorRepository.findMany(filter, { sort: { updatedAt: 1 }, skip, limit }),
      UniversityMajorRepository.count(filter),
    ]);
    return { data: withPastScore(data), pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async updateScore(id, payload) {
    const record = await UniversityMajorRepository.updateById(id, {
      admissionScore: toScore(payload.admissionScore),
      ...(payload.admissionMethods !== undefined ? { admissionMethods: toMethods(payload.admissionMethods) } : {}),
      scoreUpdatedAt: new Date(),
    });
    if (!record) throw new HttpError(404, 'Không tìm thấy quan hệ trường-ngành');
    return withPastScore(record);
  }

  async bulkUpdateScores(updates = []) {
    if (!Array.isArray(updates) || updates.length === 0) throw new HttpError(400, 'updates phải là mảng không rỗng');
    const results = [];
    for (const update of updates) {
      try {
        results.push(await this.updateScore(update.id, update));
      } catch (error) {
        results.push({ id: update.id, success: false, message: error.message });
      }
    }
    return results;
  }
}

export default new UniversityMajorService();
