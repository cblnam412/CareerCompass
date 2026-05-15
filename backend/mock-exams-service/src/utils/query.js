export const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getPagination = (query = {}, defaultLimit = 10) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const rawLimit = Number.parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(Math.max(rawLimit, 1), 1000);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const getSort = (query = {}, defaultSort = '-createdAt') => {
  const sort = query.sort || defaultSort;
  const allowedFields = new Set(['createdAt', 'updatedAt', 'title', 'name', 'code', 'combinationName', 'takenAt', 'scoreTotal']);
  const field = String(sort).replace(/^-/, '');

  if (!allowedFields.has(field)) return defaultSort;
  return sort;
};
