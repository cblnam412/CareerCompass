
export const validateRegisterUser = (req, res, next) => {
    const { fullName, email, password, DOB, address } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp fullName, email và password'
        });
    }

    const emailRegex = /^[\w\.-]+@[\w\.-]+\.\w+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Email không hợp lệ'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Mật khẩu phải có ít nhất 6 ký tự'
        });
    }

    if (fullName.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: 'Họ tên phải có ít nhất 2 ký tự'
        });
    }

    if (DOB) {
        const birthDate = new Date(DOB);
        const today = new Date();
        if (birthDate > today) {
            return res.status(400).json({
                success: false,
                message: 'Ngày sinh không hợp lệ'
            });
        }
    }

    next();
};

export const validateRegisterUniRep = (req, res, next) => {
    const { 
        fullName, email, password, DOB, address, 
        universityId, personalNote 
    } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp fullName, email và password'
        });
    }

    if (!universityId) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp universityId'
        });
    }

    if (!req.files || !req.files.studentCardFront || !req.files.studentCardBack) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng upload ảnh mặt trước và mặt sau của thẻ sinh viên'
        });
    }

    const emailRegex = /^[\w\.-]+@[\w\.-]+\.\w+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Email không hợp lệ'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Mật khẩu phải có ít nhất 6 ký tự'
        });
    }

    if (fullName.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: 'Họ tên phải có ít nhất 2 ký tự'
        });
    }

    if (DOB) {
        const birthDate = new Date(DOB);
        const today = new Date();
        if (birthDate > today) {
            return res.status(400).json({
                success: false,
                message: 'Ngày sinh không hợp lệ'
            });
        }
    }

    next();
};

export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp email và password'
        });
    }

    const emailRegex = /^[\w\.-]+@[\w\.-]+\.\w+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Email không hợp lệ'
        });
    }

    next();
};
