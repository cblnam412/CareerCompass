export const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getPagination = (query = {}, defaultLimit = 10) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

export const getSort = (query = {}, fallback = '-createdAt') => {
  const sortValue = query.sort || fallback;
  if (typeof sortValue !== 'string') return fallback;
  return sortValue
    .split(',')
    .filter(Boolean)
    .join(' ');
};

export const normalizeIdArray = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

export const toPlain = (item) => (item?.toObject ? item.toObject() : item);
