import { getUsersByIds } from '../clients/authServiceClient.js';
import { getMajorsByIds, getUniversitiesByIds } from '../clients/universityServiceClient.js';
import { toPlain } from '../utils/query.js';

const mapById = (items = []) => new Map(items.map((item) => [String(item._id), item]));

export const attachUsers = async (items, field = 'authorId') => {
  const list = Array.isArray(items) ? items : [items];
  const ids = [...new Set(list.map((item) => toPlain(item)?.[field]).filter(Boolean).map(String))];
  if (ids.length === 0) return items;

  const users = await getUsersByIds(ids);
  const universityIds = users
    .filter((user) => ['uniManager', 'uniRep'].includes(user.role) && user.universityId)
    .map((user) => user.universityId);

  if (universityIds.length > 0) {
    const universities = await getUniversitiesByIds(universityIds);
    const universityMap = mapById(universities);
    users.forEach((user) => {
      if (user.universityId && universityMap.has(String(user.universityId))) {
        user.universityId = universityMap.get(String(user.universityId));
      }
    });
  }

  const userMap = mapById(users);
  const mapped = list.map((item) => {
    const data = toPlain(item);
    return { ...data, [field]: userMap.get(String(data[field])) || data[field] };
  });

  return Array.isArray(items) ? mapped : mapped[0];
};

export const attachPostLookups = async (posts) => {
  const list = Array.isArray(posts) ? posts : [posts];
  const majorIds = [...new Set(list.flatMap((post) => toPlain(post)?.relatedMajorIds || []).map(String))];
  const universityIds = [...new Set(list.flatMap((post) => toPlain(post)?.relatedUniversityIds || []).map(String))];

  const [majors, universities, withAuthors] = await Promise.all([
    majorIds.length ? getMajorsByIds(majorIds) : [],
    universityIds.length ? getUniversitiesByIds(universityIds) : [],
    attachUsers(list, 'authorId'),
  ]);

  const majorMap = mapById(majors);
  const universityMap = mapById(universities);
  const mapped = withAuthors.map((post) => ({
    ...post,
    relatedMajorIds: (post.relatedMajorIds || []).map((id) => majorMap.get(String(id)) || id),
    relatedUniversityIds: (post.relatedUniversityIds || []).map((id) => universityMap.get(String(id)) || id),
  }));

  return Array.isArray(posts) ? mapped : mapped[0];
};
