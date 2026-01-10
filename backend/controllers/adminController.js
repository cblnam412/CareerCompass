import User from '../models/User.js';
import University from '../models/University.js';
import Subject from '../models/Subject.js';
import SubjectCombination from '../models/SubjectCombination.js';
import MockExam from '../models/MockExam.js';
import ExamResult from '../models/ExamResult.js';
import bcrypt from 'bcryptjs';

export const getAdminStats = async (req, res) => {
    try {
        // Get total counts
        const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
        const totalUniversities = await University.countDocuments();
        const totalUniReps = await User.countDocuments({ 
            role: { $in: ['uniRep', 'uniManager'] } 
        });
        const totalSubjects = await Subject.countDocuments();
        const totalSubjectCombinations = await SubjectCombination.countDocuments();
        const totalMockExams = await MockExam.countDocuments();

        // Get total number of exam questions
        const questionsResult = await MockExam.aggregate([
            {
                $group: {
                    _id: null,
                    count: { $sum: { $size: '$questions' } }
                }
            }
        ]);
        const totalQuestions = questionsResult.length > 0 ? questionsResult[0].count : 0;

        // Get test results data grouped by score (1-10)
        const testResults = await ExamResult.aggregate([
            {
                $project: {
                    point: { $ceil: '$scoreTotal' } // Round up to nearest integer
                }
            },
            {
                $match: {
                    point: { $gte: 1, $lte: 10 }
                }
            },
            {
                $group: {
                    _id: '$point',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Create array with all points 1-10, filling in zeros for points with no results
        const testResultsData = Array.from({ length: 10 }, (_, i) => {
            const point = i + 1;
            const result = testResults.find(r => r._id === point);
            return {
                point,
                count: result ? result.count : 0
            };
        });

        res.json({
            stats: {
                totalUsers,
                totalUniversities,
                totalUniReps,
                totalSubjects,
                totalSubjectCombinations,
                totalMockExams,
                totalQuestions
            },
            testResultsData
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ 
            message: 'Lỗi khi lấy thống kê',
            error: error.message 
        });
    }
};

export const createUser = async (req, res) => {
    try {
        const { fullName, email, password, role, universityId, DOB, address } = req.body;

        // Validate required fields
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin: họ tên, email, mật khẩu và vai trò'
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }

        // Validate role
        const validRoles = ['user', 'admin', 'uniRep', 'uniManager'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Vai trò không hợp lệ'
            });
        }

        // Check universityId requirement for uniRep and uniManager
        if (['uniRep', 'uniManager'].includes(role)) {
            if (!universityId) {
                return res.status(400).json({
                    success: false,
                    message: 'Vai trò uniRep hoặc uniManager phải có universityId'
                });
            }

            // Verify university exists
            const university = await University.findById(universityId);
            if (!university) {
                return res.status(404).json({
                    success: false,
                    message: 'Trường đại học không tồn tại'
                });
            }

            // Check if university already has a uniManager
            if (role === 'uniManager') {
                const existingManager = await User.findOne({
                    role: 'uniManager',
                    universityId: universityId
                });
                if (existingManager) {
                    return res.status(400).json({
                        success: false,
                        message: 'Trường này đã có quản lý trường (uniManager). Mỗi trường chỉ có một quản lý.'
                    });
                }
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            role,
            universityId: ['uniRep', 'uniManager'].includes(role) ? universityId : undefined,
            DOB: DOB ? new Date(DOB) : undefined,
            address,
            status: 'active'
        });

        await newUser.save();

        // Return user without password
        const userResponse = {
            _id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.role,
            universityId: newUser.universityId,
            DOB: newUser.DOB,
            address: newUser.address,
            status: newUser.status,
            createdAt: newUser.createdAt
        };

        res.status(201).json({
            success: true,
            message: 'Tạo người dùng thành công',
            user: userResponse
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo người dùng',
            error: error.message
        });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, role, universityId, DOB, address, status } = req.body;

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Determine the final role (either new role or existing role)
        const finalRole = role || user.role;
        const finalUniversityId = universityId || user.universityId?.toString();

        // Validate role if provided
        if (role) {
            const validRoles = ['user', 'admin', 'uniRep', 'uniManager'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Vai trò không hợp lệ'
                });
            }
        }

        // Check universityId requirement for uniRep and uniManager
        if (['uniRep', 'uniManager'].includes(finalRole)) {
            // If changing to or already is uniRep/uniManager, universityId is required
            if (role && ['uniRep', 'uniManager'].includes(role) && !universityId && !user.universityId) {
                return res.status(400).json({
                    success: false,
                    message: 'Vai trò uniRep hoặc uniManager phải có universityId'
                });
            }

            // Verify university exists if universityId is provided
            if (universityId) {
                const university = await University.findById(universityId);
                if (!university) {
                    return res.status(404).json({
                        success: false,
                        message: 'Trường đại học không tồn tại'
                    });
                }
            }

            // Check if university already has a uniManager
            // This check is needed if:
            // 1. Changing role TO uniManager, OR
            // 2. Already a uniManager but changing university
            if (finalRole === 'uniManager' && (user.role !== 'uniManager' || user.universityId?.toString() !== finalUniversityId)) {
                const existingManager = await User.findOne({
                    role: 'uniManager',
                    universityId: finalUniversityId,
                    _id: { $ne: id } // Exclude current user
                });
                if (existingManager) {
                    return res.status(400).json({
                        success: false,
                        message: 'Trường này đã có quản lý trường (uniManager). Mỗi trường chỉ có một quản lý.'
                    });
                }
            }
        } else if (role && !['uniRep', 'uniManager'].includes(role)) {
            // If changing to a non-uni role, clear universityId
            user.universityId = undefined;
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng'
                });
            }
            user.email = email;
        }

        // Update fields
        if (fullName) user.fullName = fullName;
        if (role) user.role = role;
        if (['uniRep', 'uniManager'].includes(finalRole) && universityId) {
            user.universityId = universityId;
        }
        if (DOB) user.DOB = new Date(DOB);
        if (address !== undefined) user.address = address;
        if (status) user.status = status;

        await user.save();

        // Return user without password
        const userResponse = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            universityId: user.universityId,
            DOB: user.DOB,
            address: user.address,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json({
            success: true,
            message: 'Cập nhật người dùng thành công',
            user: userResponse
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật người dùng',
            error: error.message
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } })
            .select('-password')
            .populate('universityId', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách người dùng',
            error: error.message
        });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
            .select('-password')
            .populate('universityId', 'name');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin người dùng',
            error: error.message
        });
    }
};

// export const deleteUser = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const user = await User.findById(id);
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Người dùng không tồn tại'
//             });
//         }

//         // Prevent deleting admin users
//         if (user.role === 'admin') {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Không thể xóa tài khoản admin'
//             });
//         }

//         await User.findByIdAndDelete(id);

//         res.json({
//             success: true,
//             message: 'Xóa người dùng thành công'
//         });
//     } catch (error) {
//         console.error('Error deleting user:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Lỗi khi xóa người dùng',
//             error: error.message
//         });
//     }
// };

export const unbanUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        user.status = 'active';
        user.banReleaseDate = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Gỡ cấm người dùng thành công',
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Error unbanning user:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gỡ cấm người dùng',
            error: error.message
        });
    }
};
