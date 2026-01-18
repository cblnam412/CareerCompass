import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.memoryStorage();

const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)'), false);
    }
};

const docxFileFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file .docx'), false);
    }
};

const txtFileFilter = (req, file, cb) => {
    const allowedMimes = ['text/plain'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || ext === '.txt') {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file .txt'), false);
    }
};

const excelFileFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || ext === '.xlsx' || ext === '.xls') {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file .xlsx hoặc .xls'), false);
    }
};

const documentFileFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv', '.png'];
    
    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file PDF, Word, Excel, TXT hoặc CSV'), false);
    }
};

const uploadMiddleware = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 
    }
});

const docxUploadMiddleware = multer({
    storage: diskStorage, 
    fileFilter: docxFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB cho file docx
    }
});

const txtUploadMiddleware = multer({
    storage: diskStorage,
    fileFilter: txtFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB cho file txt
    }
});

const excelUploadMiddleware = multer({
    storage: diskStorage,
    fileFilter: excelFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB cho file excel
    }
});

const documentUploadMiddleware = multer({
    storage: storage,
    fileFilter: documentFileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB cho file tài liệu
    }
});

export const uploadStudentCard = uploadMiddleware.fields([
    { name: 'studentCardFront', maxCount: 1 },
    { name: 'studentCardBack', maxCount: 1 }
]);

export const uploadSingleFile = uploadMiddleware.single('file');

export const uploadMultipleFiles = uploadMiddleware.array('files', 5);

export const uploadDocxFile = docxUploadMiddleware.single('file');

export const uploadTxtFile = txtUploadMiddleware.single('file');

export const uploadExcelFile = excelUploadMiddleware.single('file');

export const uploadMessageDocument = documentUploadMiddleware.single('document');

export default uploadMiddleware;
