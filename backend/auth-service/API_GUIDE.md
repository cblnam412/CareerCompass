# API Usage Guide

## 1. Đăng nhập (Login)

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "_id": "userId",
            "email": "user@example.com",
            "fullName": "Nguyen Van A",
            "role": "student",
            "status": "active"
        }
    }
}
```

---

## 2. Đăng ký Sinh Viên (Register User)

**Endpoint:** `POST /api/auth/register-user`

**Request:**
```json
{
    "fullName": "Nguyen Van A",
    "email": "student@example.com",
    "password": "password123",
    "DOB": "2000-01-15",
    "address": "123 Nguyen Hue, Ho Chi Minh",
    "studentId": "20210001"
}
```

**Success Response (201):**
```json
{
    "success": true,
    "message": "Đăng ký tài khoản thành công",
    "data": {
        "_id": "userId",
        "fullName": "Nguyen Van A",
        "email": "student@example.com",
        "DOB": "2000-01-15",
        "address": "123 Nguyen Hue, Ho Chi Minh",
        "studentId": "20210001",
        "role": "user",
        "status": "active",
        "createdAt": "2026-05-13T10:00:00Z"
    }
}
```

**Notes:**
- Tự động tạo StudentProfile để lưu thông tin học tập
- Email phải unique
- StudentId phải unique (nếu được cung cấp)

---

## 3. Đăng ký Đại Diện Trường (Register University Rep)

**Endpoint:** `POST /api/auth/register-uni-rep`

**Request (multipart/form-data):**
```
fullName: "Tran Thi B"
email: "rep@university.edu.vn"
password: "password123"
DOB: "1995-05-20"
address: "456 Le Loi, Da Nang"
studentId: "20150567"
universityId: "univerityId_ObjectId"
personalNote: "Tôi là sinh viên xuất sắc của trường"
studentCardFront: [File]
studentCardBack: [File]
```

**Success Response (201):**
```json
{
    "success": true,
    "message": "Đăng ký đại diện trường thành công. Vui lòng chờ quản lý trường phê duyệt",
    "data": {
        "user": {
            "_id": "userId",
            "fullName": "Tran Thi B",
            "email": "rep@university.edu.vn",
            "role": "uniRep",
            "status": "pending",
            "universityId": "univerityId"
        },
        "affiliation": {
            "_id": "affiliationId",
            "studentId": "userId",
            "studentIdNumber": "20150567",
            "universityId": "univerityId",
            "studentCardFront": "https://..../student-cards/...",
            "studentCardBack": "https://..../student-cards/...",
            "status": "pending",
            "appliedAt": "2026-05-13T10:00:00Z"
        }
    }
}
```

**Notes:**
- Cần upload 2 ảnh (mặt trước và mặt sau thẻ sinh viên)
- File tối đa 50MB
- Status mặc định: pending (chờ phê duyệt)
- Ảnh được lưu trên Supabase

---

## 4. Lấy Thông Tin User Hiện Tại (Get Me)

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
    "success": true,
    "data": {
        "_id": "userId",
        "email": "user@example.com",
        "fullName": "Nguyen Van A",
        "role": "student",
        "status": "active",
        "createdAt": "2026-05-13T10:00:00Z"
    }
}
```

---

## 5. Cập Nhật Hồ Sơ (Update Profile)

**Endpoint:** `PUT /api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
    "fullName": "Nguyen Van A Updated",
    "address": "789 New Address",
    "phone": "0901234567"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Cập nhật thông tin thành công",
    "data": {
        "_id": "userId",
        "email": "user@example.com",
        "fullName": "Nguyen Van A Updated",
        "phone": "0901234567",
        "address": "789 New Address",
        "role": "student",
        "status": "active"
    }
}
```

**Notes:**
- Không thể cập nhật email, password, role, status qua endpoint này
- Chỉ người dùng được xác thực mới có thể cập nhật hồ sơ của chính họ

---

## 6. Kiểm Tra Token (Verify Token)

**Endpoint:** `GET /api/auth/verify`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Token hợp lệ",
    "data": {
        "userId": "userId",
        "email": "user@example.com",
        "role": "student"
    }
}
```

**Error Response (401):**
```json
{
    "success": false,
    "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

---

## Error Responses

### 400 - Bad Request
```json
{
    "success": false,
    "message": "Email và mật khẩu là bắt buộc",
    "error": "..."
}
```

### 401 - Unauthorized
```json
{
    "success": false,
    "message": "Email hoặc mật khẩu không chính xác",
    "error": "..."
}
```

### 403 - Forbidden
```json
{
    "success": false,
    "message": "Tài khoản của bạn đã bị khóa",
    "error": "..."
}
```

### 404 - Not Found
```json
{
    "success": false,
    "message": "Không tìm thấy người dùng",
    "error": "..."
}
```

### 500 - Server Error
```json
{
    "success": false,
    "message": "Lỗi server khi đăng nhập",
    "error": "..."
}
```

---

## Token Format

JWT Token được trả về có format:
- Header: `Authorization: Bearer <token>`
- Token hết hạn sau 7 ngày
- Decode token: `{ userId, email, role }`

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register-user \
  -H "Content-Type: application/json" \
  -d '{
    "fullName":"Nguyen Van A",
    "email":"user@example.com",
    "password":"password123",
    "DOB":"2000-01-15",
    "address":"123 Nguyen Hue",
    "studentId":"20210001"
  }'
```

### Register Uni Rep with Files
```bash
curl -X POST http://localhost:3001/api/auth/register-uni-rep \
  -F "fullName=Tran Thi B" \
  -F "email=rep@uni.edu.vn" \
  -F "password=password123" \
  -F "DOB=1995-05-20" \
  -F "address=456 Le Loi" \
  -F "studentId=20150567" \
  -F "universityId=507f1f77bcf86cd799439011" \
  -F "personalNote=I am a good student" \
  -F "studentCardFront=@/path/to/front.jpg" \
  -F "studentCardBack=@/path/to/back.jpg"
```

### Get Me
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Get User Profile (Public)
```bash
curl -X GET http://localhost:3001/api/auth/profile/[userId]
```

### Update My Profile
```bash
curl -X PUT http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName":"Nguyen Van A New",
    "DOB":"2000-01-15",
    "address":"New Address",
    "studentId":"20210001"
  }'
```

### Upload Avatar
```bash
curl -X POST http://localhost:3001/api/auth/avatar \
  -H "Authorization: Bearer <token>" \
  -F "avatar=@/path/to/avatar.jpg"
```

### Delete Avatar
```bash
curl -X DELETE http://localhost:3001/api/auth/avatar \
  -H "Authorization: Bearer <token>"
```

---

## 7. Lấy Profile User Theo ID (Get User Profile)

**Endpoint:** `GET /api/auth/profile/:userId`

**Success Response (200):**
```json
{
    "success": true,
    "data": {
        "_id": "userId",
        "fullName": "Nguyen Van A",
        "DOB": "2000-01-15",
        "studentId": "20210001",
        "avatar": "https://..../user-avatars/...",
        "address": "123 Nguyen Hue",
        "role": "user",
        "createdAt": "2026-05-13T10:00:00Z"
    }
}
```

**Notes:**
- Công khai, không cần token
- Chỉ trả về các field cơ bản (không password)

---

## 8. Lấy Profile Của Chính Mình (Get My Profile)

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
    "success": true,
    "data": {
        "_id": "userId",
        "email": "user@example.com",
        "fullName": "Nguyen Van A",
        "phone": "0901234567",
        "DOB": "2000-01-15",
        "address": "123 Nguyen Hue",
        "avatar": "https://..../user-avatars/...",
        "studentId": "20210001",
        "role": "user",
        "status": "active",
        "createdAt": "2026-05-13T10:00:00Z"
    }
}
```

---

## 9. Cập Nhật Profile Của Chính Mình (Update My Profile)

**Endpoint:** `PUT /api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
    "fullName": "Nguyen Van A Updated",
    "DOB": "2000-01-15",
    "address": "New address here",
    "studentId": "20210001",
    "password": "newpassword123"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Cập nhật profile thành công",
    "data": {
        "_id": "userId",
        "email": "user@example.com",
        "fullName": "Nguyen Van A Updated",
        "address": "New address here",
        "studentId": "20210001",
        "role": "user"
    }
}
```

**Notes:**
- Chỉ user với role: user, uniRep, uniManager mới có thể cập nhật
- Cập nhật password sẽ tự động hash
- Email, role không thể cập nhật qua endpoint này

---

## 10. Upload Avatar

**Endpoint:** `POST /api/auth/avatar`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request (multipart/form-data):**
```
avatar: [File - JPEG, PNG]
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Cập nhật avatar thành công",
    "data": {
        "_id": "userId",
        "email": "user@example.com",
        "avatar": "https://[project].supabase.co/storage/v1/object/public/user-avatars/[timestamp]-avatars-[filename]",
        "fullName": "Nguyen Van A"
    }
}
```

**Notes:**
- Lưu trên Supabase bucket: `user-avatars`
- Avatar cũ sẽ tự động được xóa
- Tối đa file size: 50MB
- Formats: JPEG, PNG, WebP

---

## 11. Xóa Avatar

**Endpoint:** `DELETE /api/auth/avatar`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Xóa avatar thành công"
}
```

**Notes:**
- Avatar sẽ được xóa khỏi Supabase storage
- User field avatar sẽ được set về null

---

## All Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | ✗ | Đăng nhập |
| POST | /api/auth/register | ✗ | Đăng ký user |
| POST | /api/auth/register-uni-rep | ✗ | Đăng ký đại diện trường |
| GET | /api/auth/profile/:userId | ✗ | Lấy profile user (public) |
| GET | /api/auth/me | ✓ | Lấy profile của mình |
| PUT | /api/auth/profile | ✓ | Cập nhật profile |
| POST | /api/auth/avatar | ✓ | Upload avatar |
| DELETE | /api/auth/avatar | ✓ | Xóa avatar |
| GET | /api/auth/verify | ✓ | Kiểm tra token hợp lệ |
