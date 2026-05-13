import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import { connectDB } from './src/utils/dbConnect.js';
import authRoutes from './src/routes/authRoutes.js';
import { errorHandler } from './src/middlewares/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    abortOnLimit: true,
    responseOnLimit: 'Kích thước file vượt quá giới hạn 50MB',
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

connectDB();

app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Auth service đang hoạt động'
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route không tìm thấy'
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`✓ Server đang chạy trên port ${PORT}`);
    console.log(`✓ API URL: http://localhost:${PORT}/api`);
});

export default app;
