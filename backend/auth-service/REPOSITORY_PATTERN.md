# Repository Pattern - Auth Service

## Tổng Quan

Auth-service hiện tại triển khai **Repository Pattern**, tách biệt logic truy cập dữ liệu từ logic nghiệp vụ. Điều này đảm bảo rằng:

- ✅ Service (authService) không truy cập trực tiếp các model MongoDB
- ✅ Service không sử dụng trực tiếp các hàm Supabase
- ✅ Tất cả giao tiếp với cơ sở dữ liệu đều qua repositories
- ✅ Tạo điều kiện thuận lợi cho kiểm thử đơn vị và bảo trì mã

## Kiến Trúc

```
Controller (authController.js)
    ↓
Service (authService.js)
    ↓
Repositories
    ├── UserRepository.js
    ├── StudentProfileRepository.js
    ├── UniversityRepository.js
    ├── UniversityAffiliationRepository.js
    └── FileRepository.js (Supabase)
    ↓
Cơ sở dữ liệu / Supabase
```

## Các Repository Được Tạo

### 1. UserRepository
Quản lý tất cả các hoạt động liên quan đến người dùng:

```javascript
// Ví dụ sử dụng
await UserRepository.findByEmail(email);
await UserRepository.findByEmailWithPassword(email);
await UserRepository.findById(userId);
await UserRepository.create(userData);
await UserRepository.update(userId, updateData);
await UserRepository.findByStudentId(studentId);
await UserRepository.updateAvatar(userId, avatarUrl);
```

**Các phương thức có sẵn:**
- `findByEmail(email)` - Tìm user theo email
- `findByEmailWithPassword(email)` - Tìm user kèm mật khẩu (để đăng nhập)
- `findById(userId)` - Tìm user theo ID
- `findByIdWithoutPassword(userId)` - Tìm mà không lấy mật khẩu
- `findByIdWithUniversity(userId)` - Tìm kèm thông tin trường đại học
- `findByIdSelectFields(userId, fields)` - Tìm với các trường cụ thể
- `findByStudentId(studentId)` - Tìm theo mã số sinh viên
- `create(userData)` - Tạo user mới
- `update(userId, updateData)` - Cập nhật user
- `updateWithoutPassword(userId, updateData)` - Cập nhật không thay đổi mật khẩu
- `delete(userId)` - Xóa user
- `emailExists(email)` - Kiểm tra email đã tồn tại
- `studentIdExists(studentId)` - Kiểm tra mã số sinh viên đã tồn tại
- `findByRole(role)` - Tìm users theo vai trò
- `findByStatus(status)` - Tìm users theo trạng thái
- `updateAvatar(userId, avatarUrl)` - Cập nhật avatar
- `deleteAvatar(userId)` - Xóa avatar
- `findByIdWithPopulatedUniversity(userId)` - Tìm kèm thông tin trường đại học

### 2. StudentProfileRepository
Quản lý hồ sơ của sinh viên:

```javascript
// Ví dụ sử dụng
await StudentProfileRepository.create(profileData);
await StudentProfileRepository.findByUserId(userId);
await StudentProfileRepository.update(profileId, updateData);
await StudentProfileRepository.updateMBTIResult(profileId, mbtiResult);
await StudentProfileRepository.updateHollandResult(profileId, hollandResult);
```

**Các phương thức có sẵn:**
- `findById(profileId)` - Tìm hồ sơ theo ID
- `findByUserId(userId)` - Tìm hồ sơ theo ID người dùng
- `create(profileData)` - Tạo hồ sơ mới
- `update(profileId, updateData)` - Cập nhật hồ sơ
- `updateByUserId(userId, updateData)` - Cập nhật theo ID người dùng
- `delete(profileId)` - Xóa hồ sơ
- `deleteByUserId(userId)` - Xóa theo ID người dùng
- `exists(profileId)` - Kiểm tra hồ sơ tồn tại
- `existsByUserId(userId)` - Kiểm tra tồn tại theo ID người dùng
- `updateTargetUniversities(profileId, universityIds)` - Cập nhật trường đại học mục tiêu
- `updateMBTIResult(profileId, mbtiResult)` - Cập nhật kết quả MBTI
- `updateHollandResult(profileId, hollandResult)` - Cập nhật kết quả Holland
- `updateSoftSkills(profileId, softSkills)` - Cập nhật kỹ năng mềm
- `updateGPA(profileId, gpa)` - Cập nhật GPA
- `updateAcademicTranscript(profileId, transcript)` - Cập nhật bảng điểm

### 3. UniversityRepository
Quản lý các trường đại học:

```javascript
// Ví dụ sử dụng
await UniversityRepository.findById(universityId);
await UniversityRepository.findAll();
await UniversityRepository.findActiveUniversities();
await UniversityRepository.updateStatus(universityId, status);
```

**Các phương thức có sẵn:**
- `findById(universityId)` - Tìm theo ID
- `findByName(name)` - Tìm theo tên
- `findAll()` - Tìm tất cả
- `findByStatus(status)` - Tìm theo trạng thái
- `create(universityData)` - Tạo mới
- `update(universityId, updateData)` - Cập nhật
- `delete(universityId)` - Xóa
- `exists(universityId)` - Kiểm tra tồn tại
- `nameExists(name, excludeId)` - Kiểm tra tên đã tồn tại
- `updateLogo(universityId, logoUrl)` - Cập nhật logo
- `updateStatus(universityId, status)` - Cập nhật trạng thái
- `findActiveUniversities()` - Tìm các trường đang hoạt động
- `findPaginated(page, limit)` - Tìm với phân trang

### 4. UniversityAffiliationRepository
Quản lý các liên kết trường đại học:

```javascript
// Ví dụ sử dụng
await UniversityAffiliationRepository.create(affiliationData);
await UniversityAffiliationRepository.findByStudentId(studentId);
await UniversityAffiliationRepository.approve(affiliationId, reviewedBy);
await UniversityAffiliationRepository.reject(affiliationId, reviewedBy, reason);
```

**Các phương thức có sẵn:**
- `findById(affiliationId)` - Tìm theo ID
- `findByStudentId(studentId)` - Tìm theo ID sinh viên
- `findByUniversityId(universityId)` - Tìm theo ID trường đại học
- `findByStudentAndUniversity(studentId, universityId)` - Tìm theo cả hai
- `findAll()` - Tìm tất cả
- `findByStatus(status)` - Tìm theo trạng thái
- `create(affiliationData)` - Tạo mới
- `update(affiliationId, updateData)` - Cập nhật
- `delete(affiliationId)` - Xóa
- `exists(affiliationId)` - Kiểm tra tồn tại
- `updateStatus(affiliationId, status, reviewedBy, rejectionReason)` - Cập nhật trạng thái
- `approve(affiliationId, reviewedBy)` - Phê duyệt
- `reject(affiliationId, reviewedBy, rejectionReason)` - Từ chối
- `findPendingAffiliations()` - Tìm những đang chờ xử lý
- `findPendingByUniversity(universityId)` - Tìm đang chờ của trường
- `findPaginated(page, limit, filter)` - Tìm với phân trang
- `findUserAffiliationHistory(studentId)` - Tìm lịch sử liên kết của người dùng

### 5. FileRepository
Quản lý upload/delete trên Supabase:

```javascript
// Ví dụ sử dụng
await FileRepository.uploadFile(file, 'bucket-name', 'fileType');
await FileRepository.deleteFile('bucket-name', 'file-path');
await FileRepository.uploadAvatar(file);
await FileRepository.deleteAvatar(fileKey);
await FileRepository.uploadStudentCard(file, 'front');
await FileRepository.ensureBucketExists('bucket-name');
```

**Các phương thức có sẵn:**
- `uploadFile(file, bucketName, fileType)` - Upload file
- `deleteFile(bucketName, filePath)` - Xóa file
- `deleteMultipleFiles(bucketName, filePaths)` - Xóa nhiều files
- `ensureBucketExists(bucketName)` - Đảm bảo bucket tồn tại
- `getPublicUrl(bucketName, filePath)` - Lấy URL công khai
- `uploadAvatar(file)` - Upload avatar (bucket user-avatars)
- `deleteAvatar(filePath)` - Xóa avatar
- `uploadStudentCard(file, cardType)` - Upload thẻ sinh viên
- `deleteStudentCard(filePath)` - Xóa thẻ sinh viên
- `extractFileNameFromUrl(url)` - Trích xuất tên file từ URL

## Cách Sử Dụng

### Nhập Repositories

```javascript
// Trong bất kỳ tệp dịch vụ nào
import {
    UserRepository,
    StudentProfileRepository,
    UniversityRepository,
    UniversityAffiliationRepository,
    FileRepository
} from '../repositories/index.js';

// Sử dụng
const user = await UserRepository.findById(userId);
```

### Ví dụ về Dịch Vụ

```javascript
class AuthService {
    async login(email, password) {
        // Sử dụng repository thay vì User.findOne
        const user = await UserRepository.findByEmailWithPassword(email);
        
        if (!user) {
            throw { status: 401, message: 'Email hoặc mật khẩu không chính xác' };
        }
        
        // Phần còn lại của logic...
    }
}
```

## Lợi Ích

1. **Tách biệt Trách nhiệm**: Logic nghiệp vụ tách biệt với truy cập dữ liệu
2. **Khả năng Kiểm thử**: Dễ dàng tạo mocks của repositories để kiểm thử
3. **Bảo Trì**: Thay đổi trong cơ sở dữ liệu không ảnh hưởng đến các dịch vụ
4. **Tái Sử Dụng**: Các repositories có thể được sử dụng bởi nhiều services
5. **Tính Nhất Quán**: Các hoạt động cơ sở dữ liệu tập trung

## Mẫu Xử Lý Lỗi

Tất cả các repositories trả về kết quả trực tiếp:

```javascript
try {
    const user = await UserRepository.findById(userId);
    if (!user) {
        throw { status: 404, message: 'Không tìm thấy người dùng' };
    }
} catch (error) {
    // Xử lý lỗi
}
```

## Cấu Trúc Thư Mục

```
auth-service/
├── src/
│   ├── controllers/
│   │   └── authController.js
│   ├── services/
│   │   └── authService.js
│   ├── repositories/
│   │   ├── index.js
│   │   ├── UserRepository.js
│   │   ├── StudentProfileRepository.js
│   │   ├── UniversityRepository.js
│   │   ├── UniversityAffiliationRepository.js
│   │   └── FileRepository.js
│   ├── models/
│   │   ├── User.js
│   │   ├── StudentProfile.js
│   │   ├── University.js
│   │   └── UniversityAffiliation.js
│   ├── routes/
│   ├── middlewares/
│   └── utils/
└── server.js
```

## Các Bước Tiếp Theo

1. Áp dụng cùng mẫu trong các dịch vụ khác (nếu có)
2. Tạo testes đơn vị cho repositories
3. Tạo testes tích hợp cho services
4. Thêm bộ nhớ đệm nếu cần thiết

---

**Ngày Triển Khai:** 2026-05-14  
**Phiên Bản:** 1.0.0
