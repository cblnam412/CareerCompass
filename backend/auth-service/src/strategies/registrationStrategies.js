import {
    UserRepository,
    FileRepository
} from '../repositories/index.js';
import {
    createAffiliation,
    getUniversityById
} from '../clients/universityServiceClient.js';

const throwHttpError = (status, message) => {
    throw { status, message };
};

const removePassword = (user) => {
    const userResponse = user.toObject();
    delete userResponse.password;
    return userResponse;
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const getUploadedFile = (fileField) => {
    if (!fileField) return null;
    return Array.isArray(fileField) ? fileField[0] : fileField;
};

class RegistrationStrategy {
    async validateBirthday(DOB) {
        const today = new Date();
        const birthDate = new Date(DOB);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (isNaN(age) || age < 15) {
            throwHttpError(400, 'Ngay sinh khong hop le hoac ban phai tren 15 tuoi');
        }
    }

    async ensureUniqueUser(email, studentId) {
        const existingUser = await UserRepository.findByEmail(email);
        if (existingUser) {
            throwHttpError(400, 'Email da duoc su dung');
        }

        if (studentId) {
            const existingStudentId = await UserRepository.findByStudentId(studentId);
            if (existingStudentId) {
                throwHttpError(400, 'Ma so sinh vien da duoc su dung');
            }
        }
    }

    validateCommonFields({ fullName, email, password, DOB }) {
        if (!fullName?.trim() || !email?.trim() || !password) {
            throwHttpError(400, 'Ten, email va mat khau la bat buoc');
        }

        if (!DOB) {
            throwHttpError(400, 'Ngay sinh la bat buoc');
        }
    }

    async register() {
        throw new Error('Registration strategy must implement register()');
    }
}

export class StudentRegistrationStrategy extends RegistrationStrategy {
    async register({ data }) {
        const { fullName, email, password, DOB, address, studentId } = data;
        this.validateCommonFields(data);

        const normalizedEmail = normalizeEmail(email);
        const normalizedStudentId = studentId?.trim();
        await this.ensureUniqueUser(normalizedEmail, normalizedStudentId);
        await this.validateBirthday(DOB);

        const newUser = await UserRepository.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            password,
            DOB,
            address,
            studentId: normalizedStudentId || undefined,
            role: 'student',
            status: 'active'
        });

        return removePassword(newUser);
    }
}

export class UniversityRepresentativeRegistrationStrategy extends RegistrationStrategy {
    async register({ data, files }) {
        const {
            fullName,
            email,
            password,
            DOB,
            address,
            studentId,
            universityId,
            personalNote
        } = data;

        const studentCardFront = getUploadedFile(files?.studentCardFront);
        const studentCardBack = getUploadedFile(files?.studentCardBack);

        this.validateCommonFields(data);

        const normalizedEmail = normalizeEmail(email);
        const normalizedStudentId = studentId?.trim();

        if (!normalizedStudentId || !universityId) {
            throwHttpError(400, 'Ma sinh vien va ID truong dai hoc la bat buoc');
        }

        if (!studentCardFront || !studentCardBack) {
            throwHttpError(400, 'Vui long upload anh mat truoc va mat sau cua the sinh vien');
        }

        await this.ensureUniqueUser(normalizedEmail, normalizedStudentId);
        await this.validateBirthday(DOB);

        await getUniversityById(universityId);

        const bucketCheck = await FileRepository.ensureBucketExists('student-cards');
        if (!bucketCheck.success) {
            throwHttpError(500, `Loi kiem tra bucket student-cards: ${bucketCheck.error}`);
        }

        const frontCardUpload = await FileRepository.uploadStudentCard(studentCardFront, 'front');
        if (!frontCardUpload.success) {
            throwHttpError(500, `Loi upload anh mat truoc: ${frontCardUpload.error}`);
        }

        const backCardUpload = await FileRepository.uploadStudentCard(studentCardBack, 'back');
        if (!backCardUpload.success) {
            await FileRepository.deleteStudentCard(frontCardUpload.path);
            throwHttpError(500, `Loi upload anh mat sau: ${backCardUpload.error}`);
        }

        let newUser;
        try {
            newUser = await UserRepository.create({
                fullName: fullName.trim(),
                email: normalizedEmail,
                password,
                DOB,
                address,
                studentId: normalizedStudentId,
                role: 'uniRep',
                status: 'pending',
                universityId
            });

            const affiliation = await createAffiliation({
                authUserId: newUser._id.toString(),
                studentIdNumber: normalizedStudentId,
                universityId,
                studentCardFront: frontCardUpload.url,
                studentCardBack: backCardUpload.url,
                personalNote
            });

            return {
                user: removePassword(newUser),
                affiliation
            };
        } catch (error) {
            await Promise.allSettled([
                FileRepository.deleteStudentCard(frontCardUpload.path),
                FileRepository.deleteStudentCard(backCardUpload.path),
                newUser?._id ? UserRepository.delete(newUser._id) : Promise.resolve()
            ]);
            throw error;
        }
    }
}

const registrationStrategies = {
    student: new StudentRegistrationStrategy(),
    universityRepresentative: new UniversityRepresentativeRegistrationStrategy()
};

export const getRegistrationStrategy = (type) => {
    const strategy = registrationStrategies[type];
    if (!strategy) {
        throwHttpError(400, 'Loai dang ki khong hop le');
    }
    return strategy;
};
