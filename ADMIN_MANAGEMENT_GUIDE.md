# Admin Management System - Quản Lý Yêu Cầu Xin Làm Sinh Viên Đại Diện

## 📋 Tổng Quan

Hệ thống cho phép **uniManager** (quản lý trường) xử lý các yêu cầu xin làm sinh viên đại diện:
- ✅ Xem danh sách yêu cầu chờ duyệt
- ✅ Xem chi tiết từng yêu cầu (bao gồm ảnh giấy tờ)
- ✅ Phê duyệt yêu cầu → User được active, có thể đăng nhập
- ❌ Từ chối yêu cầu → User bị banned, không thể đăng nhập
- 📊 Xem thống kê

---

## 🔧 Cấu Trúc File

```
backend/
├── routes/
│   └── affiliationRoutes.js      # Định nghĩa endpoints quản lý
├── controllers/
│   └── affiliationController.js  # Xử lý CRUD logic
└── middlewares/
    └── authMiddleware.js         # Kiểm tra role/quyền hạn
```

---

## 🔐 Quyền Hạn

| Endpoint | Role | Mô Tả |
|----------|------|-------|
| GET /admin/affiliations | uniManager | Xem danh sách yêu cầu |
| GET /admin/affiliations/:id | uniManager | Xem chi tiết yêu cầu |
| PATCH /admin/affiliations/:id/approve | uniManager | Phê duyệt yêu cầu |
| PATCH /admin/affiliations/:id/reject | uniManager | Từ chối yêu cầu |
| GET /admin/affiliations/university/:id | uniManager | Xem yêu cầu của trường |
| GET /admin/affiliations/stats | uniManager | Xem thống kê |

---

## 📡 Chi Tiết API Endpoints

### Authentication
Tất cả requests phải gửi kèm `X-User-Id` header hoặc `userId` trong request body:

```javascript
// Cách 1: Header
curl -X GET "http://localhost:3000/admin/affiliations" \
  -H "X-User-Id: 607f1f77bcf86cd799439050"

// Cách 2: Body
curl -X PATCH "http://localhost:3000/admin/affiliations/:id/approve" \
  -H "Content-Type: application/json" \
  -d '{"userId": "607f1f77bcf86cd799439050", "reviewNote": "..."}'

// Cách 3: Query
curl -X GET "http://localhost:3000/admin/affiliations?userId=607f1f77bcf86cd799439050"
```

---

### 1️⃣ **GET /admin/affiliations** - Danh Sách Yêu Cầu

Lấy danh sách tất cả yêu cầu (có phân trang)

**Query Parameters:**
| Param | Type | Required | Ví dụ |
|-------|------|----------|-------|
| status | string | ❌ | `pending`, `approved`, `rejected` |
| limit | number | ❌ | `10` (default) |
| page | number | ❌ | `1` (default) |

**Curl Example:**
```bash
curl -X GET "http://localhost:3000/admin/affiliations?status=pending&limit=10&page=1" \
  -H "X-User-Id: 607f1f77bcf86cd799439050"
```

**Success Response (200):**
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
        "DOB": "2000-05-20",
        "address": "456 Đường XYZ, Quận 2"
      },
      "universityId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Đại học Kinh Tế Thành phố Hồ Chí Minh",
        "code": "UEH"
      },
      "studentCardFront": "https://fkvjiduuxqeuizoxyacb.supabase.co/storage/v1/object/public/student-cards/front/1672645800000-abc123.jpg",
      "studentCardBack": "https://fkvjiduuxqeuizoxyacb.supabase.co/storage/v1/object/public/student-cards/back/1672645800000-def456.jpg",
      "personalNote": "Tôi là sinh viên K22",
      "status": "pending",
      "reviewerId": null,
      "reviewNote": null,
      "appliedAt": "2026-01-02T10:35:00Z",
      "reviewedAt": null,
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

**Error Responses:**
- 401: Chưa đăng nhập
- 403: Không phải uniManager

---

### 2️⃣ **GET /admin/affiliations/:id** - Chi Tiết Yêu Cầu

Lấy thông tin đầy đủ của một yêu cầu

**Parameters:**
| Param | Type | Required |
|-------|------|----------|
| id | string | ✅ |

**Curl Example:**
```bash
curl -X GET "http://localhost:3000/admin/affiliations/507f1f77bcf86cd799439014" \
  -H "X-User-Id: 607f1f77bcf86cd799439050"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "studentId": {
      "_id": "507f1f77bcf86cd799439013",
      "fullName": "Trần Thị B",
      "email": "uni-rep@example.com",
      "DOB": "2000-05-20",
      "address": "456 Đường XYZ",
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

### 3️⃣ **PATCH /admin/affiliations/:id/approve** - Phê Duyệt

Phê duyệt yêu cầu và kích hoạt tài khoản

**Body:**
```json
{
  "reviewNote": "Giấy tờ hợp lệ, chấp nhận làm sinh viên đại diện"
}
```

**Curl Example:**
```bash
curl -X PATCH "http://localhost:3000/admin/affiliations/507f1f77bcf86cd799439014/approve" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 607f1f77bcf86cd799439050" \
  -d '{
    "reviewNote": "Giấy tờ hợp lệ"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Đã phê duyệt yêu cầu xin làm sinh viên đại diện trường",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "studentId": {
      "_id": "507f1f77bcf86cd799439013",
      "fullName": "Trần Thị B",
      "email": "uni-rep@example.com",
      "status": "active"
    },
    "universityId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Đại học Kinh Tế",
      "code": "UEH"
    },
    "status": "approved",
    "reviewerId": {
      "_id": "607f1f77bcf86cd799439050",
      "fullName": "Quản Lý Trường"
    },
    "reviewNote": "Giấy tờ hợp lệ",
    "reviewedAt": "2026-01-02T11:00:00Z"
  }
}
```

**Tác động:**
- UniversityAffiliation.status: pending → **approved**
- User.status: pending → **active**
- reviewerId, reviewNote, reviewedAt được cập nhật

---

### 4️⃣ **PATCH /admin/affiliations/:id/reject** - Từ Chối

Từ chối yêu cầu và khóa tài khoản

**Body:**
```json
{
  "reviewNote": "Giấy tờ không hợp lệ. Thẻ sinh viên hết hạn."
}
```

**⚠️ Lưu ý:** `reviewNote` là **bắt buộc**

**Curl Example:**
```bash
curl -X PATCH "http://localhost:3000/admin/affiliations/507f1f77bcf86cd799439014/reject" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 607f1f77bcf86cd799439050" \
  -d '{
    "reviewNote": "Giấy tờ không hợp lệ"
  }'
```

**Success Response (200):**
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
      "fullName": "Quản Lý Trường"
    },
    "reviewNote": "Giấy tờ không hợp lệ",
    "reviewedAt": "2026-01-02T11:05:00Z"
  }
}
```

**Tác động:**
- UniversityAffiliation.status: pending → **rejected**
- User.status: pending → **banned**
- reviewerId, reviewNote, reviewedAt được cập nhật

---

### 5️⃣ **GET /admin/affiliations/university/:universityId** - Yêu Cầu Theo Trường

Lấy danh sách yêu cầu của một trường cụ thể

**Parameters:**
| Param | Type | Required |
|-------|------|----------|
| universityId | string | ✅ |

**Query:**
| Param | Type | Required |
|-------|------|----------|
| status | string | ❌ |
| limit | number | ❌ |
| page | number | ❌ |

**Curl Example:**
```bash
curl -X GET "http://localhost:3000/admin/affiliations/university/507f1f77bcf86cd799439012?status=pending" \
  -H "X-User-Id: 607f1f77bcf86cd799439050"
```

**Success Response (200):** (Tương tự GET /admin/affiliations)

---

### 6️⃣ **GET /admin/affiliations/stats** - Thống Kê

Lấy thống kê số lượng yêu cầu

**Curl Example:**
```bash
curl -X GET "http://localhost:3000/admin/affiliations/stats" \
  -H "X-User-Id: 607f1f77bcf86cd799439050"
```

**Success Response (200):**
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

## 🔄 User Status Workflow

```
┌─────────────────────────────────────────────────┐
│    Sinh Viên Đăng Ký Làm Đại Diện Trường        │
├─────────────────────────────────────────────────┤
│                                                 │
│  POST /auth/register-uni-rep                    │
│         ↓                                        │
│  User.status = "pending"                        │
│  UniversityAffiliation.status = "pending"       │
│         ↓                                        │
│  ┌────────────────────────────────────────┐    │
│  │   uniManager Review (Admin)             │    │
│  └────────────────────────────────────────┘    │
│         ↙                 ↘                     │
│        ✅ Approve          ❌ Reject            │
│         ↓                   ↓                    │
│  status="active"    status="banned"             │
│  Có thể đăng nhập   Không thể đăng nhập        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 💾 Data Storage

### Student Cards Location
- **Bucket**: `student-cards`
- **Front**: `/front/<timestamp>-<random>-<filename>`
- **Back**: `/back/<timestamp>-<random>-<filename>`
- **Provider**: Supabase Cloud Storage

### Database Records
- **User Model**: Mỗi yêu cầu tạo 1 User record
- **UniversityAffiliation Model**: Lưu trữ giấy tờ và metadata

---

## 🚀 Workflow Tổng Quát

```javascript
// 1. Sinh viên đăng ký (POST /auth/register-uni-rep)
// - Upload ảnh → Supabase
// - Tạo User (status: "pending")
// - Tạo UniversityAffiliation (status: "pending")

// 2. uniManager xem yêu cầu (GET /admin/affiliations)
// - Xem danh sách chờ duyệt
// - Xem chi tiết + ảnh giấy tờ

// 3a. uniManager phê duyệt (PATCH /admin/affiliations/:id/approve)
// - UniversityAffiliation.status = "approved"
// - User.status = "active" → Có thể đăng nhập
// - Ghi nhận reviewer

// 3b. uniManager từ chối (PATCH /admin/affiliations/:id/reject)
// - UniversityAffiliation.status = "rejected"
// - User.status = "banned" → Không thể đăng nhập
// - Ghi lý do từ chối
```

---

## ❌ Common Errors

| Code | Message | Giải pháp |
|------|---------|-----------|
| 401 | Vui lòng đăng nhập | Thêm `X-User-Id` header |
| 403 | Không có quyền | Chỉ uniManager mới được |
| 404 | Yêu cầu không tồn tại | Kiểm tra ID |
| 400 | Trạng thái hiện tại không cho phép | Chỉ pending có thể duyệt |

---

## 🧪 Test Workflow Hoàn Chỉnh

```bash
# 1. Lấy danh sách pending
curl -X GET "http://localhost:3000/admin/affiliations?status=pending" \
  -H "X-User-Id: 607f1f77bcf86cd799439050"

# 2. Lấy chi tiết
curl -X GET "http://localhost:3000/admin/affiliations/507f1f77bcf86cd799439014" \
  -H "X-User-Id: 607f1f77bcf86cd799439050"

# 3. Phê duyệt
curl -X PATCH "http://localhost:3000/admin/affiliations/507f1f77bcf86cd799439014/approve" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 607f1f77bcf86cd799439050" \
  -d '{"reviewNote": "OK"}'

# 4. Kiểm tra user status
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "uni-rep@example.com",
    "password": "password123"
  }'
```

---

## 📌 Important Notes

⚠️ **Security:**
- Chỉ user có `X-User-Id` (đã đăng nhập) mới access được
- User phải có role `uniManager`
- Validation dữ liệu bắt buộc ở middleware

✅ **Best Practices:**
- Luôn kiểm tra chi tiết trước khi phê duyệt
- Viết lý do cụ thể khi từ chối
- Giữ lịch sử review (reviewedAt, reviewerId, reviewNote)

🔄 **Status Transitions:**
```
pending → approved (phê duyệt) ✅
pending → rejected (từ chối) ❌
```
Không thể revert sau khi duyệt/từ chối (design safety)
