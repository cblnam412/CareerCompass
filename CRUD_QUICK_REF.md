# 🚀 CRUD SubjectCombination & SoftSkill - Quick Reference

## Overview

| Resource | Public | Admin | Base URL |
|----------|--------|-------|----------|
| SubjectCombination | R | CRUD | `/api` |
| SoftSkill | R | CRUD | `/api` |

---

## SubjectCombination Endpoints

### Public (Không cần đăng nhập)

```bash
# Danh sách
GET /api/subject-combinations?search=A&limit=10&page=1

# Chi tiết
GET /api/subject-combinations/{id}
```

### Admin Only

```bash
# Tạo
POST /admin/subject-combinations
Body: { combinationName, subjects: [] }

# Cập nhật
PATCH /admin/subject-combinations/{id}
Body: { combinationName?, subjects?: [] }

# Xóa
DELETE /admin/subject-combinations/{id}
```

---

## SoftSkill Endpoints

### Public (Không cần đăng nhập)

```bash
# Danh sách
GET /api/soft-skills?search=Communication&limit=10&page=1

# Chi tiết
GET /api/soft-skills/{id}
```

### Admin Only

```bash
# Tạo
POST /admin/soft-skills
Body: { softSkillName }

# Cập nhật
PATCH /admin/soft-skills/{id}
Body: { softSkillName }

# Xóa
DELETE /admin/soft-skills/{id}
```

---

## Authentication

**Header required for Admin endpoints:**
```
-H "X-User-Id: {adminUserId}"
```

---

## Quick Test

### SubjectCombination

```bash
# 1. Public - Danh sách
curl "http://localhost:3000/api/subject-combinations"

# 2. Admin - Tạo
curl -X POST "http://localhost:3000/admin/subject-combinations" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: ADMIN_ID" \
  -d '{"combinationName":"A00","subjects":["Toán","Lý","Hóa"]}'

# 3. Admin - Cập nhật
curl -X PATCH "http://localhost:3000/admin/subject-combinations/ID" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: ADMIN_ID" \
  -d '{"subjects":["Toán","Lý","Anh"]}'

# 4. Admin - Xóa
curl -X DELETE "http://localhost:3000/admin/subject-combinations/ID" \
  -H "X-User-Id: ADMIN_ID"
```

### SoftSkill

```bash
# 1. Public - Danh sách
curl "http://localhost:3000/api/soft-skills"

# 2. Admin - Tạo
curl -X POST "http://localhost:3000/admin/soft-skills" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: ADMIN_ID" \
  -d '{"softSkillName":"Leadership"}'

# 3. Admin - Cập nhật
curl -X PATCH "http://localhost:3000/admin/soft-skills/ID" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: ADMIN_ID" \
  -d '{"softSkillName":"Team Leadership"}'

# 4. Admin - Xóa
curl -X DELETE "http://localhost:3000/admin/soft-skills/ID" \
  -H "X-User-Id: ADMIN_ID"
```

---

## Response Format

### Success (200, 201)
```json
{
  "success": true,
  "message": "...",
  "data": { ... },
  "pagination": { ... }  // Chỉ GET list
}
```

### Error (4xx, 5xx)
```json
{
  "success": false,
  "message": "Error description",
  "error": "..."
}
```

---

## Validation

**SubjectCombination:**
- `combinationName`: bắt buộc, không trùng
- `subjects`: array, không rỗng

**SoftSkill:**
- `softSkillName`: bắt buộc, không trùng

---

## Files Changed

✅ **New:**
- `controllers/subjectCombinationController.js`
- `controllers/softSkillController.js`
- `routes/subjectCombinationRoutes.js`
- `routes/softSkillRoutes.js`
- `CRUD_GUIDE.md`

✅ **Updated:**
- `server.js` - Added routes

---

## Key Features

✅ Search support (case-insensitive)
✅ Pagination (limit, page)
✅ Admin-only CRUD
✅ Public read access
✅ Input validation
✅ Error handling
