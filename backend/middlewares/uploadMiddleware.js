import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)'), false);
    }
};

const uploadMiddleware = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 
    }
});

export const uploadStudentCard = uploadMiddleware.fields([
    { name: 'studentCardFront', maxCount: 1 },
    { name: 'studentCardBack', maxCount: 1 }
]);

export const uploadSingleFile = uploadMiddleware.single('file');

export const uploadMultipleFiles = uploadMiddleware.array('files', 5);

export default uploadMiddleware;
