import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import gatewayRoutes from './src/routes/gateway.js';
import { errorHandler } from './src/middlewares/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== Middleware ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan(':remote-addr - :method :url :status :res[content-length] - :response-time ms'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API Gateway đang hoạt động',
        timestamp: new Date().toISOString()
    });
});

// ==================== Routes ====================
app.use('/api', gatewayRoutes);

// 404 handler
app.use('{/*path}', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route không tìm thấy',
        path: req.originalUrl
    });
});

// ==================== Error Handler ====================
app.use(errorHandler);

// ==================== Server ====================
app.listen(PORT, () => {
    console.log(`\nAPI Gateway đang chạy trên port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}/api`);
    console.log(`Health check: http://localhost:${PORT}/health\n`);
});
