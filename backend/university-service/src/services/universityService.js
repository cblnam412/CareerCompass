import fs from 'fs/promises';
import UniversityRepository from '../repositories/UniversityRepository.js';
import provinces from '../utils/provinces.js';
import { parseUniversitiesFromExcel, validateBulkUniversities } from '../utils/excelParser.js';
import { escapeRegex, getPagination } from '../utils/query.js';
import { HttpError } from '../utils/httpError.js';

const normalizeUniversityPayload = (payload) => ({
  ...payload,
  name: payload.name?.trim(),
  code: payload.code?.trim()?.toUpperCase(),
  phone: Array.isArray(payload.phone)
    ? payload.phone.map((phone) => String(phone).trim()).filter(Boolean)
    : payload.phone
      ? String(payload.phone).split(',').map((phone) => phone.trim()).filter(Boolean)
      : [],
});

class UniversityService {
  async create(payload) {
    const data = normalizeUniversityPayload(payload);
    if (!data.name || !data.code) throw new HttpError(400, 'Tên trường và mã trường là bắt buộc');

    const duplicate = await UniversityRepository.findDuplicate(data);
    if (duplicate) {
      const duplicatedName = duplicate.name.toLowerCase() === data.name.toLowerCase();
      throw new HttpError(409, duplicatedName ? `Tên trường "${data.name}" đã tồn tại` : `Mã trường "${data.code}" đã tồn tại`);
    }

    return UniversityRepository.create(data);
  }

  async importFromExcel(filePath) {
    try {
      const universities = parseUniversitiesFromExcel(filePath);
      if (universities.length === 0) throw new HttpError(400, 'Không tìm thấy trường hợp lệ trong file Excel');

      const validation = validateBulkUniversities(universities);
      if (!validation.isValid) throw new HttpError(400, 'Dữ liệu Excel không hợp lệ', validation.errors);

      const existingCodes = await UniversityRepository.findCodes(validation.validRecords.map((item) => item.code));
      const existingCodeSet = new Set(existingCodes.map((item) => item.code.toUpperCase()));
      const newUniversities = validation.validRecords.filter((item) => !existingCodeSet.has(item.code.toUpperCase()));

      if (newUniversities.length === 0) {
        throw new HttpError(400, 'Tất cả trường trong file đã tồn tại', { skipped: validation.validRecords.length });
      }

      const inserted = await UniversityRepository.insertMany(newUniversities);
      return {
        imported: inserted.length,
        skipped: validation.validRecords.length - inserted.length,
        data: inserted,
      };
    } finally {
      await fs.rm(filePath, { force: true }).catch(() => {});
    }
  }

  async getAll(query = {}) {
    const { search, region } = query;
    const filter = {};
    if (search) {
      const regex = { $regex: escapeRegex(search), $options: 'i' };
      filter.$or = [{ name: regex }, { code: regex }];
    }
    if (region) filter.region = { $regex: escapeRegex(region), $options: 'i' };

    if (query.page || query.limit || search || region) {
      const { page, limit, skip } = getPagination(query, 20);
      const [data, total] = await Promise.all([
        UniversityRepository.findMany(filter, '_id name code region address website phone description', { sort: { name: 1 }, skip, limit }),
        UniversityRepository.count(filter),
      ]);
      return {
        data,
        count: data.length,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      };
    }

    const data = await UniversityRepository.findMany({}, '_id name code region address website phone description', { sort: { name: 1 } });
    return { data, count: data.length };
  }

  async getById(id) {
    const university = await UniversityRepository.findById(id);
    if (!university) throw new HttpError(404, 'Không tìm thấy trường đại học');
    return university;
  }

  async update(id, payload) {
    const university = await UniversityRepository.findById(id);
    if (!university) throw new HttpError(404, 'Không tìm thấy trường đại học');

    const data = normalizeUniversityPayload(payload);
    if (data.name || data.code) {
      const duplicate = await UniversityRepository.findDuplicate({ ...data, excludeId: id });
      if (duplicate) {
        const duplicatedName = data.name && duplicate.name.toLowerCase() === data.name.toLowerCase();
        throw new HttpError(409, duplicatedName ? `Tên trường "${data.name}" đã được sử dụng` : `Mã trường "${data.code}" đã được sử dụng`);
      }
    }

    const allowedFields = ['name', 'code', 'description', 'address', 'website', 'region', 'phone', 'email', 'logo', 'status'];
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) university[field] = data[field];
    });

    return university.save();
  }

  async delete(id) {
    const university = await UniversityRepository.deleteById(id);
    if (!university) throw new HttpError(404, 'Không tìm thấy trường đại học');
    return university;
  }

  getProvinces() {
    return [...provinces].sort((a, b) => a.localeCompare(b, 'vi'));
  }
}

export default new UniversityService();
