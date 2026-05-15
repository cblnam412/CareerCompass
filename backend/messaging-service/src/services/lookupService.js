import { getUsersByIds } from '../clients/authServiceClient.js';
import { getUniversitiesByIds } from '../clients/universityServiceClient.js';
import { toPlain } from '../utils/query.js';

const mapById = (items = []) => new Map(items.map((item) => [String(item._id), item]));

export const attachUsers = async (items, fields = ['senderId', 'receiverId']) => {
  const list = Array.isArray(items) ? items : [items];
  const ids = [
    ...new Set(
      list.flatMap((item) => {
        const data = toPlain(item);
        return fields.map((field) => data?.[field]).filter(Boolean);
      }).map(String),
    ),
  ];

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
    const next = { ...data };
    fields.forEach((field) => {
      if (next[field]) next[field] = userMap.get(String(next[field])) || next[field];
    });
    return next;
  });

  return Array.isArray(items) ? mapped : mapped[0];
};

export const attachConversationLookups = async (conversations) => {
  const list = Array.isArray(conversations) ? conversations : [conversations];
  const plain = list.map(toPlain);
  const universityIds = [...new Set(plain.map((item) => item?.universityId).filter(Boolean).map(String))];

  const [withUsers, universities] = await Promise.all([
    attachUsers(plain, ['studentId', 'uniManagerId']),
    universityIds.length ? getUniversitiesByIds(universityIds) : [],
  ]);

  const universityMap = mapById(universities);
  const mapped = withUsers.map((conversation) => ({
    ...conversation,
    universityId: universityMap.get(String(conversation.universityId)) || conversation.universityId,
  }));

  return Array.isArray(conversations) ? mapped : mapped[0];
};
