 Tính Năng Đăng Ký (Registration)

## 📋 Tổng Quan

Hệ thống đăng ký hỗ trợ **hai loại người dùng**:
1. **Người dùng thường** (học sinh/sinh viên) - Đăng ký nhanh, tài khoản active ngay
2. **Đại diện trường đại học** (uniRep) - Cần cung cấp giấy tờ, chờ uniManager phê duyệt

---

## 🔧 Cấu Trúc File

```
backend/
├── routes/
│   └── authRoutes.js           # Định nghĩa các endpoints
├── controllers/
│   └── authController.js       # Xử lý logic đăng ký/đăng nhập
├── middlewares/
│   └── validationMiddleware.js # Xác thực dữ liệu đầu vào
└── models/
    ├── User.js
    ├── StudentProfile.js
    └── UniversityAffiliation.js
```

---

## 📡 API Endpoints

### 1. **POST /auth/register** - Đăng ký người dùng thường

**Mô tả:** Đăng ký tài khoản cho học sinh/sinh viên thường
- Tài khoản được **active ngay lập tức**
- Không cần phê duyệt

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "password123",
  "DOB": "2005-01-15",
  "address": "123 Đường ABC, Quận 1"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Đăng ký tài khoản thành công",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "role": "user",
    "status": "active",
    "DOB": "2005-01-15",
    "address": "123 Đường ABC, Quận 1",
    "createdAt": "2026-01-02T10:30:00Z"
  }
}
```

**Validation:**
- ✅ fullName, email, password **bắt buộc**
- ✅ Email phải hợp lệ (format: `xxx@xxx.xxx`)
- ✅ Password tối thiểu 6 ký tự
- ✅ fullName tối thiểu 2 ký tự
- ✅ Email chưa được đăng ký
- ✅ Ngày sinh phải <= ngày hôm nay

---

### 2. **POST /auth/register-uni-rep** - Đăng ký đại diện trường

**Mô tả:** Đăng ký tài khoản cho đại diện trường đại học
- Tài khoản ban đầu có status **"pending"** (chờ phê duyệt)
- Tạo record UniversityAffiliation cũng ở trạng thái **"pending"**
- uniManager sẽ duyệt qua endpoint khác (sẽ tạo thêm)
- **Thay đổi mới**: Hình ảnh thẻ sinh viên được upload lên Supabase thay vì gửi URL

**Request Type:** `multipart/form-data` (Form Data)

**Form Fields:**
```
fullName: "Trần Thị B" (text)
email: "uni-rep@example.com" (text)
password: "password123" (text)
DOB: "2000-05-20" (text)
address: "456 Đường XYZ, Quận 2" (text)
universityId: "507f1f77bcf86cd799439012" (text)
personalNote: "Tôi là sinh viên K22" (text)
studentCardFront: [File] (image file - JPEG, PNG, WebP)
studentCardBack: [File] (image file - JPEG, PNG, WebP)
```

**File Requirements:**
- ✅ Loại file: JPEG, PNG, WebP
- ✅ Kích thước tối đa: 5MB
- ✅ Bắt buộc: Cả 2 file (mặt trước và mặt sau)

**Response (201):**
```json
{
  "success": true,
  "message": "Đăng ký đại diện trường thành công. Vui lòng chờ quản lý trường phê duyệt",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439013",
      "fullName": "Trần Thị B",
      "email": "uni-rep@example.com",
      "role": "uniRep",
      "status": "pending",
      "universityId": "507f1f77bcf86cd799439012",
      "createdAt": "2026-01-02T10:35:00Z"
    },
    "affiliation": {
      "_id": "507f1f77bcf86cd799439014",
      "studentId": "507f1f77bcf86cd799439013",
      "universityId": "507f1f77bcf86cd799439012",
      "studentCardFront": "https://fkvjiduuxqeuizoxyacb.supabase.co/storage/v1/object/public/student-cards/front/1672645800000-abc123-card-front.jpg",
      "studentCardBack": "https://fkvjiduuxqeuizoxyacb.supabase.co/storage/v1/object/public/student-cards/back/1672645800000-def456-card-back.jpg",
      "personalNote": "Tôi là sinh viên K22",
      "status": "pending",
      "appliedAt": "2026-01-02T10:35:00Z",
      "createdAt": "2026-01-02T10:35:00Z"
    }
  }
}
```

**Validation:**
- ✅ fullName, email, password, universityId **bắt buộc**
- ✅ studentCardFront, studentCardBack **bắt buộc** (files)
- ✅ Email phải hợp lệ & chưa được đăng ký
- ✅ Password tối thiểu 6 ký tự
- ✅ universityId phải tồn tại trong database
- ✅ Files phải là ảnh và <= 5MB

---

### 3. **POST /auth/login** - Đăng nhập

**Mô tả:** Đăng nhập vào hệ thống

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "role": "user",
    "status": "active",
    "createdAt": "2026-01-02T10:30:00Z"
  }
}
```

**Kiểm tra:**
- ❌ Status "banned" → Lỗi 403 (tài khoản bị khóa)
- ❌ Status "pending" → Lỗi 403 (chờ phê duyệt)
- ❌ Email hoặc password sai → Lỗi 401

---

## 📊 User Status Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    NGƯỜI DÙNG THƯỜNG                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  POST /auth/register                                        │
│         │                                                    │
│         ▼                                                    │
│  User.create() ──► status: "active" ──► Có thể đăng nhập    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ĐẠI DIỆN TRƯỜNG (uniRep)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  POST /auth/register-uni-rep                                │
│         │                                                    │
│         ▼                                                    │
│  User.create() ──► status: "pending"                        │
│  UniversityAffiliation.create() ──► status: "pending"       │
│         │                                                    │
│         ▼ (uniManager review)                               │
│  /admin/affiliation/approve/:id ──► status: "approved"      │
│                                                              │
│  /admin/affiliation/reject/:id ──► status: "rejected"       │
│                                    User.status: "banned"    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Bảo Mật

✅ **Implemented:**
- Password hashed với bcryptjs (10 salt rounds)
- Email validation regex
- Required field validation
- Status check khi login

⚠️ **Cần thêm (TODO):**
- JWT token authentication
- Rate limiting (chống brute force)
- Email verification
- Password strength requirements

---

## 🧪 Ví Dụ Test API

### Test đăng ký người dùng:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "address": "123 Street"
  }'
```

### Test đăng ký đại diện trường (với file upload):
```bash
curl -X POST http://localhost:3000/auth/register-uni-rep \
  -F "fullName=University Rep" \
  -F "email=uni-rep@example.com" \
  -F "password=password123" \
  -F "universityId=607f1f77bcf86cd799439012" \
  -F "studentCardFront=@/path/to/card-front.jpg" \
  -F "studentCardBack=@/path/to/card-back.jpg" \
  -F "personalNote=Tôi là sinh viên K22"
```

**Lưu ý:** Dùng `-F` (form-data) thay vì `-d` (JSON body) để upload file

### Test login:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## � ADMIN API - Quản Lý Yêu Cầu Xin Làm Sinh Viên Đại Diện

**Yêu cầu:** Tất cả endpoints dưới đây chỉ **uniManager** có quyền truy cập.
- Header: `X-User-Id: <userId>` hoặc `userId` trong request body/query

### 1. **GET /admin/affiliations** - Lấy danh sách yêu cầu

**Mô tả:** Lấy danh sách tất cả yêu cầu xin làm sinh viên đại diện (có phân trang)

**Query Parameters:**
- `status` (optional): `pending`, `approved`, `rejected`
- `limit` (optional): số record mỗi trang (default: 10)
- `page` (optional): số trang (default: 1)

**Request:**
```bash
curl -X GET "http://localhost:3000/admin/affiliations?status=pending&limit=10&page=1" \
  -H "X-User-Id: 607f1f77bcf86cd799439050"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "studentId": {
        "_id": "507f1f77bcf86cd799439013",
        "fullName": "Trần Thị B",
        "email": "uni-rep@example.com",
        "DOB": "2000-05-20"
      },
      "universityId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Đại học Kinh Tế",
        "code": "UEH"
      },
      "studentCardFront": "https://...",
      "studentCardBack": "https://...",
      "personalNote": "Tôi là sinh viên K22",
      "status": "pending",
      "appliedAt": "2026-01-02T10:35:00Z",
      "createdAt": "2026-01-02T10:35:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

---

### 2. **GET /admin/affiliations/:id** - Lấy chi tiết một yêu cầu

**Mô tả:** Lấy chi tiết đầy đủ của một yêu cầu

**Request:**
```bash
curl -X GET "http://localhost:3000/admin/affiliations/507f1f77bcf86cd799439014" \
  -H "X-User-Id: 607f1f77bcf86cd799439050"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "studentId": {
      "_id": "507f1f77bcf86cd799439013",
      "fullName": "Trần Thị B",
      "email": "uni-rep@example.com",
      "status": "pending",
      "role": "uniRep"
    },
    "universityId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Đại học Kinh Tế",
      "code": "UEH"
    },
    "studentCardFront": "https://...",
    "studentCardBack": "https://...",
    "personalNote": "Tôi là sinh viên K22",
    "status": "pending",
    "reviewerId": null,
    "reviewNote": null,
    "appliedAt": "2026-01-02T10:35:00Z",
    "reviewedAt": null,
    "createdAt": "2026-01-02T10:35:00Z"
  }
}
```

---

### 3. **PATCH /admin/affiliations/:id/approve** - Phê duyệt yêu cầu

**Mô tả:** Phê duyệt yêu cầu xin làm sinh viên đại diện
- Cập nhật `UniversityAffiliation.status` → `approved`
- Cập nhật `User.status` → `active` (có thể đăng nhập)
- Ghi lại `reviewerId` và `reviewedAt`

**Request Body:**
```json
{
  "reviewNote": "Giấy tờ hợp lệ. Chấp nhận làm sinh viên đại diện."
}
```

**Request:**
```bash
curl -X PATCH "http://localhost:3000/admin/affiliations/507f1f77bcf86cd799439014/approve" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 607f1f77bcf86cd799439050" \
  -d '{
    "reviewNote": "Giấy tờ hợp lệ"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Đã phê duyệt yêu cầu xin làm sinh viên đại diện trường",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "studentId": {
      "_id": "507f1f77bcf86cd799439013",
      "fullName": "Trần Thị B",
      "status": "active"
    },
    "status": "approved",
    "reviewerId": {
      "_id": "607f1f77bcf86cd799439050",
      "fullName": "Quản lý Trường"
    },
    "reviewNote": "Giấy tờ hợp lệ",
    "reviewedAt": "2026-01-02T11:00:00Z"
  }
}
```

---

### 4. **PATCH /admin/affiliations/:id/reject** - Từ chối yêu cầu

**Mô tả:** Từ chối yêu cầu xin làm sinh viên đại diện
- Cập nhật `UniversityAffiliation.status` → `rejected`
- Cập nhật `User.status` → `banned` (không được đăng nhập)
- **Bắt buộc** phải cung cấp `reviewNote` (lý do từ chối)

**Request Body:**
```json
{
  "reviewNote": "Giấy tờ không hợp lệ. Thẻ sinh viên hết hạn."
}
```

**Request:**
```bash
curl -X PATCH "http://localhost:3000/admin/affiliations/507f1f77bcf86cd799439014/reject" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 607f1f77bcf86cd799439050" \
  -d '{
    "reviewNote": "Giấy tờ không hợp lệ"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Đã từ chối yêu cầu xin làm sinh viên đại diện trường",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "studentId": {
      "_id": "507f1f77bcf86cd799439013",
      "fullName": "Trần Thị B",
      "status": "banned"
    },
    "status": "rejected",
    "reviewerId": {
      "_id": "607f1f77bcf86cd799439050",
      "fullName": "Quản lý Trường"
    },
    "reviewNote": "Giấy tờ không hợp lệ",
    "reviewedAt": "2026-01-02T11:05:00Z"
  }
}
```

---

### 5. **GET /admin/affiliations/university/:universityId** - Lấy yêu cầu của một trường

**Mô tả:** Lấy danh sách yêu cầu của một trường cụ thể

**Query Parameters:**
- `status` (optional): `pending`, `approved`, `rejected`
- `limit` (optional): default 10
- `page` (optional): default 1

**Request:**
```bash
curl -X GET "http://localhost:3000/admin/affiliations/university/507f1f77bcf86cd799439012?status=pending" \
  -H "X-User-Id: 607f1f77bcf86cd799439050"
```

**Response (200):** (tương tự GET /admin/affiliations)

---

### 6. **GET /admin/affiliations/stats** - Lấy thống kê

**Mô tả:** Lấy thống kê số lượng yêu cầu theo trạng thái

**Request:**
```bash
curl -X GET "http://localhost:3000/admin/affiliations/stats" \
  -H "X-User-Id: 607f1f77bcf86cd799439050"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "pending": 15,
    "approved": 30,
    "rejected": 5
  }
}
```

---

## 🔐 Authentication for Admin APIs

**Phương thức 1: Header `X-User-Id`** (đơn giản, để test)
```bash
curl -X GET "http://localhost:3000/admin/affiliations" \
  -H "X-User-Id: 607f1f77bcf86cd799439050"
```

**Phương thức 2: Body `userId`** (cho POST/PATCH)
```bash
curl -X PATCH "http://localhost:3000/admin/affiliations/:id/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "607f1f77bcf86cd799439050",
    "reviewNote": "..."
  }'
```

**Phương thức 3: Query parameter `userId`** (cho GET)
```bash
curl -X GET "http://localhost:3000/admin/affiliations?userId=607f1f77bcf86cd799439050"
```

---

## �📝 Database Schema Changes

### User Model:
- ✅ `password` được hash trước lưu
- ✅ `role`: ['user', 'admin', 'uniRep', 'uniManager']
- ✅ `status`: ['active', 'pending', 'banned']
- ✅ `universityId` (cho uniRep)

### UniversityAffiliation Model:
- ✅ `status`: ['pending', 'approved', 'rejected']
- ✅ `reviewerId` (uniManager sẽ set khi review)
- ✅ `reviewNote` (ghi chú từ reviewer)

---

## 🚀 Tiếp Theo (TODO Features)

1. **Admin endpoints** để phê duyệt/từ chối uniRep:
   - PATCH `/admin/affiliation/approve/:id`
   - PATCH `/admin/affiliation/reject/:id`

2. **JWT Token Authentication** cho các protected routes

3. **Email Verification** (gửi link confirm qua email)

4. **Student Profile Creation** - Tạo StudentProfile record khi user đăng ký

5. **Password Reset** functionality

6. **Logout** endpoint

---

## 🛠️ Cài Đặt & Chạy

```bash
# Cài dependencies
npm install

# Chạy server
npm run dev

# Server sẽ chạy tại http://localhost:3000
```

Kiểm tra `.env` file có chứa `MONGODB_URI` và `PORT`.
