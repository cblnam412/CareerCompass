# 🚀 Quick Reference - Admin CRUD APIs

## Endpoints Overview

| # | Method | Endpoint | Tác vụ |
|---|--------|----------|--------|
| 1 | GET | `/admin/affiliations` | Danh sách yêu cầu |
| 2 | GET | `/admin/affiliations/:id` | Chi tiết yêu cầu |
| 3 | PATCH | `/admin/affiliations/:id/approve` | ✅ Phê duyệt |
| 4 | PATCH | `/admin/affiliations/:id/reject` | ❌ Từ chối |
| 5 | GET | `/admin/affiliations/university/:id` | Yêu cầu theo trường |
| 6 | GET | `/admin/affiliations/stats` | Thống kê |

---

## Authentication

**Thêm một trong những cách này:**

```javascript
// Cách 1: Header (Khuyến nghị)
-H "X-User-Id: {userId}"

// Cách 2: Body field
-d '{"userId": "{userId}", ...}'

// Cách 3: Query parameter
?userId={userId}
```

---

## Endpoint Details

### 1️⃣ GET /admin/affiliations

**Lấy danh sách (có phân trang)**

```bash
curl -X GET "http://localhost:3000/admin/affiliations?status=pending&page=1&limit=10" \
  -H "X-User-Id: {managerId}"
```

**Query Params:**
- `status`: pending | approved | rejected (optional)
- `page`: số trang (default: 1)
- `limit`: records/trang (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {"total": 50, "page": 1, "limit": 10, "pages": 5}
}
```

---

### 2️⃣ GET /admin/affiliations/:id

**Xem chi tiết một yêu cầu**

```bash
curl -X GET "http://localhost:3000/admin/affiliations/{affiliationId}" \
  -H "X-User-Id: {managerId}"
```

**Response:** Chi tiết đầy đủ (student info + giấy tờ)

---

### 3️⃣ PATCH /admin/affiliations/:id/approve

**Phê duyệt yêu cầu** ✅

```bash
curl -X PATCH "http://localhost:3000/admin/affiliations/{affiliationId}/approve" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: {managerId}" \
  -d '{"reviewNote": "OK, chấp nhận"}'
```

**Body:**
- `reviewNote`: string (optional) - Ghi chú

**Tác động:**
- ✅ `UniversityAffiliation.status` = approved
- ✅ `User.status` = active (có thể đăng nhập)

---

### 4️⃣ PATCH /admin/affiliations/:id/reject

**Từ chối yêu cầu** ❌

```bash
curl -X PATCH "http://localhost:3000/admin/affiliations/{affiliationId}/reject" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: {managerId}" \
  -d '{"reviewNote": "Thẻ sinh viên hết hạn"}'
```

**Body:**
- `reviewNote`: string ⚠️ **BẮTBUỘC** - Lý do từ chối

**Tác động:**
- ❌ `UniversityAffiliation.status` = rejected
- ❌ `User.status` = banned (khóa tài khoản)

---

### 5️⃣ GET /admin/affiliations/university/:universityId

**Yêu cầu của một trường**

```bash
curl -X GET "http://localhost:3000/admin/affiliations/university/{universityId}?status=pending" \
  -H "X-User-Id: {managerId}"
```

**Query Params:** Giống endpoint #1

---

### 6️⃣ GET /admin/affiliations/stats

**Thống kê**

```bash
curl -X GET "http://localhost:3000/admin/affiliations/stats" \
  -H "X-User-Id: {managerId}"
```

**Response:**
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

## Data Fields

### Request Body (Approve/Reject)
```javascript
{
  "reviewNote": "string"  // Ghi chú (bắt buộc khi reject)
}
```

### Response Data (Affiliation)
```javascript
{
  "_id": "string",
  "studentId": {
    "_id": "string",
    "fullName": "string",
    "email": "string",
    "status": "active|pending|banned"
  },
  "universityId": {
    "_id": "string",
    "name": "string",
    "code": "string"
  },
  "studentCardFront": "string (URL)",
  "studentCardBack": "string (URL)",
  "personalNote": "string",
  "status": "pending|approved|rejected",
  "reviewerId": "string|null",
  "reviewNote": "string|null",
  "appliedAt": "ISO Date",
  "reviewedAt": "ISO Date|null"
}
```

---

## Status Codes

| Code | Meaning | Tác vụ |
|------|---------|--------|
| 200 | Success | GET, PATCH thành công |
| 201 | Created | Đăng ký thành công |
| 400 | Bad Request | Dữ liệu không hợp lệ |
| 401 | Unauthorized | Chưa đăng nhập |
| 403 | Forbidden | Không phải uniManager |
| 404 | Not Found | Record không tồn tại |
| 500 | Server Error | Lỗi server |

---

## Common Errors

### ❌ 401 Unauthorized
```
"Vui lòng đăng nhập trước"
→ Thêm X-User-Id header
```

### ❌ 403 Forbidden
```
"Bạn không có quyền... Chỉ quản lý trường (uniManager) mới có quyền"
→ User phải là uniManager
```

### ❌ 404 Not Found
```
"Yêu cầu không tồn tại"
→ Kiểm tra affiliationId
```

### ❌ 400 Bad Request
```
"Vui lòng cung cấp lý do từ chối"
→ reviewNote bắt buộc khi reject
```

---

## Workflow Example

```bash
# 1. Lấy stats
curl -X GET "http://localhost:3000/admin/affiliations/stats" \
  -H "X-User-Id: 607f..."

# 2. Xem pending
curl -X GET "http://localhost:3000/admin/affiliations?status=pending" \
  -H "X-User-Id: 607f..."

# 3. Xem chi tiết
curl -X GET "http://localhost:3000/admin/affiliations/607f...aff/14" \
  -H "X-User-Id: 607f..."

# 4a. Phê duyệt
curl -X PATCH "http://localhost:3000/admin/affiliations/607f...aff/14/approve" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 607f..." \
  -d '{"reviewNote": "Giấy tờ hợp lệ"}'

# HOẶC 4b. Từ chối
curl -X PATCH "http://localhost:3000/admin/affiliations/607f...aff/14/reject" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 607f..." \
  -d '{"reviewNote": "Thẻ hết hạn"}'
```

---

## Key Points

✅ **Nhớ ghi:**
- `X-User-Id` cho tất cả requests
- `reviewNote` bắt buộc khi reject
- Chỉ pending có thể duyệt
- Không thể revert sau khi duyệt

✅ **Check trước khi phê duyệt:**
- Xem ảnh giấy tờ (studentCardFront/Back URLs)
- Xem studentId info
- Xem personNote của ứng viên

---

## Documentation Files

📚 **Tài liệu đầy đủ:**
- `REGISTRATION_GUIDE.md` - Tính năng đăng ký
- `ADMIN_MANAGEMENT_GUIDE.md` - Chi tiết admin API
- `ADMIN_CRUD_SUMMARY.md` - Tóm tắt CRUD

---

## Files Changed

✅ **Thêm:**
- `middlewares/authMiddleware.js`
- `controllers/affiliationController.js`
- `routes/affiliationRoutes.js`
- `ADMIN_MANAGEMENT_GUIDE.md`
- `ADMIN_CRUD_SUMMARY.md`

✅ **Cập nhật:**
- `server.js` - Thêm affiliation routes
- `REGISTRATION_GUIDE.md` - Thêm admin sections
