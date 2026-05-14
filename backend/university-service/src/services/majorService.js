import fs from 'fs/promises';
import MajorRepository from '../repositories/MajorRepository.js';
import { exportToCSV } from '../utils/csvExporter.js';
import { parseTextFile, validateBulkMajors } from '../utils/textParser.js';
import { escapeRegex, getPagination } from '../utils/query.js';
import { HttpError } from '../utils/httpError.js';

const cleanPayload = ({ name, category, description }) => ({
  ...(name !== undefined ? { name: name.trim() } : {}),
  ...(category !== undefined ? { category: category.trim() } : {}),
  ...(description !== undefined ? { description: description ? description.trim() : '' } : {}),
});

class MajorService {
  async create(payload) {
    const data = cleanPayload(payload);
    if (!data.name || !data.category) throw new HttpError(400, 'Tên ngành và nhóm ngành là bắt buộc');
    if (await MajorRepository.findByName(data.name)) throw new HttpError(409, 'Ngành học này đã tồn tại');
    return MajorRepository.create(data);
  }

  async bulkUpload(filePath) {
    try {
      const majors = parseTextFile(filePath);
      const validation = validateBulkMajors(majors);
      if (!validation.isValid) throw new HttpError(400, 'Dữ liệu file TXT không hợp lệ', validation.errors);

      const duplicateNames = [];
      for (const major of validation.validRecords) {
        if (await MajorRepository.findByName(major.name)) duplicateNames.push(major.name);
      }
      if (duplicateNames.length > 0) {
        throw new HttpError(409, 'Một số ngành đã tồn tại', {
          duplicates: duplicateNames,
          successCount: validation.validRecords.length - duplicateNames.length,
          totalCount: validation.validRecords.length,
        });
      }

      const inserted = await MajorRepository.insertMany(validation.validRecords.map(cleanPayload));
      return { count: inserted.length, data: inserted };
    } finally {
      await fs.rm(filePath, { force: true }).catch(() => {});
    }
  }

  async update(id, payload) {
    const major = await MajorRepository.findById(id);
    if (!major) throw new HttpError(404, 'Không tìm thấy ngành học');
    const data = cleanPayload(payload);

    if (data.name && data.name.toLowerCase() !== major.name.toLowerCase()) {
      if (await MajorRepository.findByName(data.name, id)) throw new HttpError(409, 'Ngành học này đã tồn tại');
    }

    Object.assign(major, data);
    return major.save();
  }

  async delete(id) {
    const major = await MajorRepository.deleteById(id);
    if (!major) throw new HttpError(404, 'Không tìm thấy ngành học');
    return major;
  }

  async deleteMany(ids) {
    if (!Array.isArray(ids) || ids.length === 0) throw new HttpError(400, 'majorIds phải là mảng không rỗng');
    return MajorRepository.deleteManyByIds(ids);
  }

  async getAll(query) {
    const { page, limit, skip } = getPagination(query, 10);
    const { search, category, sortBy = 'name', sortOrder = 'asc' } = query;
    const filter = {};

    if (search) {
      const regex = { $regex: escapeRegex(search), $options: 'i' };
      filter.$or = [{ name: regex }, { description: regex }];
    }
    if (category) filter.category = { $regex: escapeRegex(category), $options: 'i' };

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const [data, total] = await Promise.all([
      MajorRepository.findMany(filter, { sort, skip, limit }),
      MajorRepository.count(filter),
    ]);

    return { data, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async getById(id) {
    const major = await MajorRepository.findById(id);
    if (!major) throw new HttpError(404, 'Không tìm thấy ngành học');
    return major;
  }

  async search(keyword) {
    if (!keyword?.trim()) throw new HttpError(400, 'Từ khóa tìm kiếm là bắt buộc');
    const regex = { $regex: escapeRegex(keyword), $options: 'i' };
    return MajorRepository.findMany({ $or: [{ name: regex }, { category: regex }, { description: regex }] }, { limit: 20, sort: { name: 1 } });
  }

  getByCategory(category) {
    return MajorRepository.findMany({ category: { $regex: escapeRegex(category), $options: 'i' } }, { sort: { name: 1 } });
  }

  async getCategories() {
    return (await MajorRepository.distinct('category')).sort((a, b) => a.localeCompare(b, 'vi'));
  }

  async getStats() {
    const [totalMajors, byCategory] = await Promise.all([
      MajorRepository.count(),
      MajorRepository.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ]);
    return { totalMajors, byCategory };
  }

  async exportCSV() {
    const majors = await MajorRepository.findMany({}, { projection: 'name category description', sort: { name: 1 } });
    return exportToCSV(majors);
  }
}

export default new MajorService();
