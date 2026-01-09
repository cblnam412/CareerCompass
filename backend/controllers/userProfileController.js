import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { uploadFileToSupabase, deleteFileFromSupabase } from '../utils/supabaseUtils.js';

export const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select(
            'fullName DOB studentId avatar address role universityId createdAt'
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if ((user.role === 'uniRep' || user.role === 'uniManager') && user.universityId) {
            await user.populate('universityId', 'name code region address phone website description');
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thông tin profile',
            error: error.message
        });
    }
};

export const getMyProfile = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if ((user.role === 'uniRep' || user.role === 'uniManager') && user.universityId) {
            await user.populate('universityId', 'name code region address phone website description');
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thông tin profile',
            error: error.message
        });
    }
};

export const updateMyProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { fullName, DOB, address, studentId, password } = req.body;

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if (!['user', 'uniRep', 'uniManager'].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền chỉnh sửa profile'
            });
        }

        if (fullName) user.fullName = fullName.trim();
        if (DOB) user.DOB = DOB;
        if (address) user.address = address.trim();
        if (studentId) user.studentId = studentId.trim();

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        const updated = await user.save();
        const userResponse = updated.toObject();
        delete userResponse.password;

        res.status(200).json({
            success: true,
            message: 'Cập nhật profile thành công',
            data: userResponse
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật profile',
            error: error.message
        });
    }
};
export const uploadAvatar = async (req, res) => {
    try {
        const userId = req.userId;

        if (!req.files || !req.files.avatar || req.files.avatar.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn ảnh'
            });
        }

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if (user.avatar) {
            try {
                const oldFileKey = user.avatar.split('/').pop();
                await deleteFileFromSupabase('user-avatars', oldFileKey);
            } catch (error) {
                console.error('Error deleting old avatar:', error);
            }
        }

        const file = req.files.avatar[0];
        const fileName = `${userId}_${Date.now()}`;
        const fileBuffer = file.buffer;
        
        const avatarUrl = await uploadFileToSupabase(
            'user-avatars',
            fileBuffer,
            fileName,
            file.mimetype
        );

        user.avatar = avatarUrl;
        const updated = await user.save();
        
        const userResponse = updated.toObject();
        delete userResponse.password;

        res.status(200).json({
            success: true,
            message: 'Cập nhật avatar thành công',
            data: userResponse
        });

    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi upload avatar',
            error: error.message
        });
    }
};

export const deleteAvatar = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if (user.avatar) {
            try {
                const fileKey = user.avatar.split('/').pop();
                await deleteFileFromSupabase('user-avatars', fileKey);
            } catch (error) {
                console.error('Error deleting avatar:', error);
            }
            
            user.avatar = null;
            await user.save();
        }

        res.status(200).json({
            success: true,
            message: 'Xóa avatar thành công'
        });

    } catch (error) {
        console.error('Delete avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xóa avatar',
            error: error.message
        });
    }
};