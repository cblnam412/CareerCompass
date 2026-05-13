import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);

        console.log('✓ MongoDB kết nối thành công');
        return conn;
    } catch (error) {
        console.error('✗ Lỗi kết nối MongoDB:', error.message);
        process.exit(1);
    }
};
