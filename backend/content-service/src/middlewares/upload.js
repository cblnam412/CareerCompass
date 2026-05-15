import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadForumPostFiles = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 },
]);

export const uploadForumCommentFiles = upload.fields([
  { name: 'image', maxCount: 1 },
]);
