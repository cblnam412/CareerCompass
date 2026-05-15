import multer from 'multer';

const allowedMimes = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',
];

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedExtension = /\.(xlsx|xls)$/i.test(file.originalname);
    if (allowedMimes.includes(file.mimetype) || allowedExtension) {
      cb(null, true);
    } else {
      cb(new Error('Chi chap nhan file Excel (.xlsx, .xls)'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadExcelFile = upload.single('file');
