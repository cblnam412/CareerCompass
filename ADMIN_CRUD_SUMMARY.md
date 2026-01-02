# 📌 CRUD Xử Lí Yêu Cầu Sinh Viên Đại Diện - Tóm Tắt

## ✅ Completed Tasks

### 1. **Authentication Middleware** (`middlewares/authMiddleware.js`)
- ✅ `checkAuth()` - Kiểm tra user đã đăng nhập
- ✅ `checkUniManagerRole()` - Kiểm tra user có role `uniManager`
- ✅ `checkAdminRole()` - Kiểm tra user có role `admin`
- ✅ `checkRoles()` - Generic middleware kiểm tra nhiều roles

### 2. **Affiliation Controller** (`controllers/affiliationController.js`)
CRUD Operations cho UniversityAffiliation:

| Function | Method | Endpoint | Quyền |
|----------|--------|----------|-------|
| getAffiliations | GET | /admin/affiliations | uniManager |
| getAffiliationById | GET | /admin/affiliations/:id | uniManager |
| approveAffiliation | PATCH | /admin/affiliations/:id/approve | uniManager |
| rejectAffiliation | PATCH | /admin/affiliations/:id/reject | uniManager |
| getAffiliationsByUniversity | GET | /admin/affiliations/university/:id | uniManager |
| getAffiliationStats | GET | /admin/affiliations/stats | uniManager |

### 3. **Affiliation Routes** (`routes/affiliationRoutes.js`)
- ✅ 6 endpoints đầy đủ
- ✅ Tự động kiểm tra auth + role
- ✅ Hỗ trợ filter, phân trang, thống kê

### 4. **Server Integration** (`server.js`)
- ✅ Thêm route `/admin` để xử lý affiliations

### 5. **Documentation**
- ✅ `REGISTRATION_GUIDE.md` - Cập nhật admin endpoints
- ✅ `ADMIN_MANAGEMENT_GUIDE.md` - Tài liệu chi tiết

---

## 🎯 Main Features

### 📋 Xem Danh Sách
```
GET /admin/affiliations
- Lấy tất cả yêu cầu (pending/approved/rejected)
- Hỗ trợ phân trang (limit, page)
- Trả về 10 record mặc định
```

### 🔍 Xem Chi Tiết
```
GET /admin/affiliations/:id
- Xem full info của 1 yêu cầu
- Bao gồm: user info, giấy tờ, notes
```

### ✅ Phê Duyệt
```
PATCH /admin/affiliations/:id/approve
- Cập nhật status: pending → approved
- User.status: pending → active (có thể đăng nhập)
- Ghi lại reviewer + reviewedAt
```

### ❌ Từ Chối
```
PATCH /admin/affiliations/:id/reject
- Cập nhật status: pending → rejected
- User.status: pending → banned (khóa tài khoản)
- Bắt buộc ghi lý do (reviewNote)
```

### 📊 Thống Kê
```
GET /admin/affiliations/stats
- Xem tổng số yêu cầu
- Breakdown: pending, approved, rejected
```

---

## 🔐 Authorization Flow

```javascript
// Request từ client
GET /admin/affiliations
  ↓
// Middleware: checkAuth
- Kiểm tra X-User-Id header
- Tìm user trong database
- Ghi vào req.userId
  ↓
// Middleware: checkUniManagerRole
- Kiểm tra user.role === 'uniManager'
- Nếu không → 403 Forbidden
- Nếu có → ghi vào req.user
  ↓
// Controller: getAffiliations
- Thực thi business logic
- Trả về response
```

---

## 📁 File Structure

```
backend/
├── middlewares/
│   ├── authMiddleware.js ✅ NEW
│   ├── uploadMiddleware.js (existing)
│   └── validationMiddleware.js (existing)
│
├── controllers/
│   ├── authController.js (existing)
│   └── affiliationController.js ✅ NEW
│
├── routes/
│   ├── authRoutes.js (existing)
│   └── affiliationRoutes.js ✅ NEW
│
├── server.js ✅ UPDATED
└── ...

docs/
├── REGISTRATION_GUIDE.md ✅ UPDATED
└── ADMIN_MANAGEMENT_GUIDE.md ✅ NEW
```

---

## 🧪 Quick Test Examples

### 1. Xem danh sách pending
```bash
curl -X GET "http://localhost:3000/admin/affiliations?status=pending" \
  -H "X-User-Id: USER_ID_HERE"
```

### 2. Xem chi tiết
```bash
curl -X GET "http://localhost:3000/admin/affiliations/607f1f77bcf86cd799439014" \
  -H "X-User-Id: USER_ID_HERE"
```

### 3. Phê duyệt
```bash
curl -X PATCH "http://localhost:3000/admin/affiliations/607f1f77bcf86cd799439014/approve" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: USER_ID_HERE" \
  -d '{"reviewNote": "Giấy tờ hợp lệ"}'
```

### 4. Từ chối
```bash
curl -X PATCH "http://localhost:3000/admin/affiliations/607f1f77bcf86cd799439014/reject" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: USER_ID_HERE" \
  -d '{"reviewNote": "Thẻ sinh viên hết hạn"}'
```

### 5. Thống kê
```bash
curl -X GET "http://localhost:3000/admin/affiliations/stats" \
  -H "X-User-Id: USER_ID_HERE"
```

---

## 🔄 User Status Changes

### Approval Flow
```
uniRep đăng ký
    ↓
User.status = "pending"
UniversityAffiliation.status = "pending"
    ↓
uniManager phê duyệt (approve)
    ↓
User.status = "active" ✅
UniversityAffiliation.status = "approved"
    ↓
uniRep có thể đăng nhập
```

### Rejection Flow
```
uniRep đăng ký
    ↓
User.status = "pending"
UniversityAffiliation.status = "pending"
    ↓
uniManager từ chối (reject)
    ↓
User.status = "banned" ❌
UniversityAffiliation.status = "rejected"
    ↓
uniRep không thể đăng nhập
```

---

## 🛡️ Security Features

✅ **Role-based Access Control (RBAC)**
- Chỉ `uniManager` có quyền

✅ **Input Validation**
- Kiểm tra ID tồn tại
- Validate status transitions
- Bắt buộc `reviewNote` khi reject

✅ **Data Integrity**
- Ghi lại reviewer + timestamp
- Không thể revert status
- Audit trail đầy đủ

---

## 📝 Database Schema

### UniversityAffiliation Updates
```javascript
{
  status: 'pending' | 'approved' | 'rejected',
  reviewerId: ObjectId,      // uniManager id
  reviewNote: String,         // Ghi chú/lý do
  reviewedAt: Date,          // Thời gian review
  // ... existing fields
}
```

### User Status Updates
```javascript
{
  status: 'active' | 'pending' | 'banned',
  // pending → active (approve)
  // pending → banned (reject)
}
```

---

## 🚀 Next Steps (Optional)

1. **JWT Token Authentication** (thay vì X-User-Id)
2. **Email Notifications** (gửi email khi approved/rejected)
3. **Audit Logging** (track tất cả actions)
4. **Soft Delete** (không xóa vĩnh viễn)
5. **Appeal System** (sinh viên có thể kháng cáo)

---

## 💡 Usage Tips

### 1. Kiểm tra quyền trước
```bash
# Chắc chắn X-User-Id tồn tại và là uniManager
```

### 2. Validate data
```bash
# Kiểm tra studentId, universityId tồn tại
```

### 3. Viết lý do khi reject
```bash
# reviewNote cần cụ thể, dễ hiểu
```

### 4. Xem stats trước
```bash
# GET /admin/affiliations/stats
# Để biết có bao nhiêu pending
```

---

## 📞 Support

Tham khảo chi tiết:
- 📖 [REGISTRATION_GUIDE.md](../REGISTRATION_GUIDE.md) - Hệ thống đăng ký
- 📖 [ADMIN_MANAGEMENT_GUIDE.md](../ADMIN_MANAGEMENT_GUIDE.md) - Admin API
