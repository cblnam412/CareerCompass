import User from '../models/User.js';

const BAN_DURATIONS = {
    1: 1,   
    2: 5,    
    3: 14,     
    4: null    
};

export const banAccount = async (userId, violationCount) => {
    try {
        const violationLevel = Math.min(violationCount, 4);
        const banDuration = BAN_DURATIONS[violationLevel];
        
        let banReleaseDate = null;
        let isPermanent = false;
        
        if (banDuration === null) {
            isPermanent = true;
            banReleaseDate = new Date('2099-12-31'); // Set ngày rất xa để biết là vĩnh viễn
        } else {
            banReleaseDate = new Date();
            banReleaseDate.setDate(banReleaseDate.getDate() + banDuration);
        }
        
        const user = await User.findByIdAndUpdate(
            userId,
            {
                status: 'banned',
                banReleaseDate: banReleaseDate
            },
            { new: true }
        );
        
        return {
            user,
            banReleaseDate,
            duration: banDuration,
            isPermanent,
            message: isPermanent 
                ? 'Tài khoản bị ban vĩnh viễn'
                : `Tài khoản bị ban ${banDuration} ngày`
        };
    } catch (error) {
        console.error('Ban account error:', error);
        throw error;
    }
};

export const unbanAccount = async (userId) => {
    try {
        const user = await User.findByIdAndUpdate(
            userId,
            {
                status: 'active',
                banReleaseDate: null
            },
            { new: true }
        );
        
        return {
            success: true,
            message: 'Tài khoản đã được mở ban',
            user
        };
    } catch (error) {
        console.error('Unban account error:', error);
        throw error;
    }
};

export const checkBanStatus = (user) => {
    if (!user || user.status !== 'banned') {
        return { isBanned: false };
    }
    
    const now = new Date();
    const banReleaseDate = new Date(user.banReleaseDate);
    
    if (now >= banReleaseDate) {
        // Hết hạn ban
        return { 
            isBanned: false, 
            shouldUnban: true 
        };
    }
    
    const isPermanent = banReleaseDate.getFullYear() >= 2099;
    
    return {
        isBanned: true,
        isPermanent,
        banReleaseDate,
        daysRemaining: Math.ceil((banReleaseDate - now) / (1000 * 60 * 60 * 24)),
        message: isPermanent 
            ? 'Tài khoản của bạn bị ban vĩnh viễn'
            : `Tài khoản của bạn bị ban đến ${banReleaseDate.toLocaleDateString('vi-VN')}`
    };
};

export default { banAccount, unbanAccount, checkBanStatus };
