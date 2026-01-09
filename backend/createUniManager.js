import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import University from './models/University.js';

dotenv.config();

const createUniManager = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        let university = await University.findOne();
        
        if (!university) {
            console.log('No university found. Creating test university...');
            university = await University.create({
                name: 'Đại học Test',
                code: 'TEST',
                region: 'Hà Nội',
                address: '123 Test Street',
                phone: '0123456789',
                website: 'https://test.edu.vn',
                description: 'Test University'
            });
            console.log('Created test university:', university._id);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('unimanager123', salt);

        const uniManager = await User.create({
            fullName: 'Quản Lý Trường',
            email: 'unimanager@test.com',
            password: hashedPassword,
            role: 'uniManager',
            universityId: university._id,
            status: 'active'
        });

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);

    } catch (error) {
        console.error('Error creating uniManager:', error.message);
        process.exit(1);
    }
};

createUniManager();
