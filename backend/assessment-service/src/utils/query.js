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

export const toPlain = (item) => (item?.toObject ? item.toObject() : item);
