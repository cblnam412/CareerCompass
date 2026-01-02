# Subject Combination & Soft Skill Management API

## 📋 Tổng Quan

Hệ thống quản lý **kết hợp môn học** (Subject Combination) và **kỹ năng mềm** (Soft Skill):

### SubjectCombination (Kết hợp môn học)
- Ví dụ: A00, A01, B00, D01, C00
- Mỗi kết hợp có danh sách các môn học
- Dùng để gợi ý ngành dựa trên kết hợp

### SoftSkill (Kỹ năng mềm)
- Ví dụ: Communication, Leadership, Teamwork
- Dùng để đánh giá sinh viên
- Liên kết trong StudentProfile

---

## 🔐 Quyền Hạn

| Tác vụ | Public | Admin |
|--------|--------|-------|
| Xem danh sách | ✅ | ✅ |
| Xem chi tiết | ✅ | ✅ |
| Tìm kiếm | ✅ | ✅ |
| Tạo | ❌ | ✅ |
| Cập nhật | ❌ | ✅ |
| Xóa | ❌ | ✅ |

---

## 📡 API Endpoints

### SubjectCombination

#### Public Endpoints

**1️⃣ GET /api/subject-combinations** - Danh Sách

Lấy danh sách tất cả kết hợp môn học

**Query Parameters:**
```
?search=A&limit=10&page=1
```

**Curl Example:**
```bash
curl -X GET "http://localhost:3000/api/subject-combinations?search=A&page=1&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "607f1f77bcf86cd799439020",
      "combinationName": "A00",
      "subjects": ["Toán", "Vật Lý", "Hóa Học"]
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

**2️⃣ GET /api/subject-combinations/:id** - Chi Tiết

Lấy chi tiết một kết hợp

```bash
curl -X GET "http://localhost:3000/api/subject-combinations/607f1f77bcf86cd799439020"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "607f1f77bcf86cd799439020",
    "combinationName": "A00",
    "subjects": ["Toán", "Vật Lý", "Hóa Học"]
  }
}
```

#### Admin Only Endpoints

**3️⃣ POST /admin/subject-combinations** - Tạo

Tạo kết hợp môn học mới

**Body:**
```json
{
  "combinationName": "A01",
  "subjects": ["Toán", "Vật Lý", "Sinh Học"]
}
```

**Curl:**
```bash
curl -X POST "http://localhost:3000/admin/subject-combinations" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: {adminId}" \
  -d '{
    "combinationName": "A01",
    "subjects": ["Toán", "Vật Lý", "Sinh Học"]
  }'
```

**Response (201):**
```json
{
  "success": true,
  "message": "Tạo kết hợp môn học thành công",
  "data": {
    "_id": "607f1f77bcf86cd799439021",
    "combinationName": "A01",
    "subjects": ["Toán", "Vật Lý", "Sinh Học"]
  }
}
```

**4️⃣ PATCH /admin/subject-combinations/:id** - Cập Nhật

Cập nhật kết hợp môn học

**Body:**
```json
{
  "combinationName": "A01 Updated",
  "subjects": ["Toán", "Vật Lý", "Tiếng Anh"]
}
```

**Curl:**
```bash
curl -X PATCH "http://localhost:3000/admin/subject-combinations/607f1f77bcf86cd799439021" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: {adminId}" \
  -d '{
    "combinationName": "A01 Updated",
    "subjects": ["Toán", "Vật Lý", "Tiếng Anh"]
  }'
```

**Response (200):** Tương tự POST response

**5️⃣ DELETE /admin/subject-combinations/:id** - Xóa

Xóa kết hợp môn học

**Curl:**
```bash
curl -X DELETE "http://localhost:3000/admin/subject-combinations/607f1f77bcf86cd799439021" \
  -H "X-User-Id: {adminId}"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Xóa kết hợp môn học thành công",
  "data": { ... }
}
```

---

### SoftSkill

#### Public Endpoints

**1️⃣ GET /api/soft-skills** - Danh Sách

Lấy danh sách tất cả kỹ năng mềm

**Query Parameters:**
```
?search=Communication&limit=10&page=1
```

**Curl:**
```bash
curl -X GET "http://localhost:3000/api/soft-skills?search=Communication&page=1&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "607f1f77bcf86cd799439030",
      "softSkillName": "Communication"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

**2️⃣ GET /api/soft-skills/:id** - Chi Tiết

```bash
curl -X GET "http://localhost:3000/api/soft-skills/607f1f77bcf86cd799439030"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "607f1f77bcf86cd799439030",
    "softSkillName": "Communication"
  }
}
```

#### Admin Only Endpoints

**3️⃣ POST /admin/soft-skills** - Tạo

Tạo kỹ năng mềm mới

**Body:**
```json
{
  "softSkillName": "Leadership"
}
```

**Curl:**
```bash
curl -X POST "http://localhost:3000/admin/soft-skills" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: {adminId}" \
  -d '{"softSkillName": "Leadership"}'
```

**Response (201):**
```json
{
  "success": true,
  "message": "Tạo kỹ năng mềm thành công",
  "data": {
    "_id": "607f1f77bcf86cd799439031",
    "softSkillName": "Leadership"
  }
}
```

**4️⃣ PATCH /admin/soft-skills/:id** - Cập Nhật

```bash
curl -X PATCH "http://localhost:3000/admin/soft-skills/607f1f77bcf86cd799439031" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: {adminId}" \
  -d '{"softSkillName": "Team Leadership"}'
```

**5️⃣ DELETE /admin/soft-skills/:id** - Xóa

```bash
curl -X DELETE "http://localhost:3000/admin/soft-skills/607f1f77bcf86cd799439031" \
  -H "X-User-Id: {adminId}"
```

---

## ✅ Validation Rules

### SubjectCombination
- ✅ `combinationName` bắt buộc, không trùng lặp (case-insensitive)
- ✅ `subjects` là mảng, không rỗng
- ✅ Mỗi môn học được trim whitespace

### SoftSkill
- ✅ `softSkillName` bắt buộc, không trùng lặp (case-insensitive)
- ✅ Tên được trim whitespace

---

## 🧪 Test Examples

### SubjectCombination

```bash
# 1. Xem danh sách
curl "http://localhost:3000/api/subject-combinations?search=A"

# 2. Xem chi tiết
curl "http://localhost:3000/api/subject-combinations/{id}"

# 3. Tạo (Admin)
curl -X POST "http://localhost:3000/admin/subject-combinations" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: {adminId}" \
  -d '{
    "combinationName": "B00",
    "subjects": ["Toán", "Hóa Học", "Sinh Học"]
  }'

# 4. Cập nhật
curl -X PATCH "http://localhost:3000/admin/subject-combinations/{id}" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: {adminId}" \
  -d '{"combinationName": "B00 Updated"}'

# 5. Xóa
curl -X DELETE "http://localhost:3000/admin/subject-combinations/{id}" \
  -H "X-User-Id: {adminId}"
```

### SoftSkill

```bash
# 1. Xem danh sách
curl "http://localhost:3000/api/soft-skills?search=Communication"

# 2. Xem chi tiết
curl "http://localhost:3000/api/soft-skills/{id}"

# 3. Tạo (Admin)
curl -X POST "http://localhost:3000/admin/soft-skills" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: {adminId}" \
  -d '{"softSkillName": "Problem Solving"}'

# 4. Cập nhật
curl -X PATCH "http://localhost:3000/admin/soft-skills/{id}" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: {adminId}" \
  -d '{"softSkillName": "Critical Thinking"}'

# 5. Xóa
curl -X DELETE "http://localhost:3000/admin/soft-skills/{id}" \
  -H "X-User-Id: {adminId}"
```

---

## 🔐 Authentication

Admin endpoints yêu cầu header `X-User-Id` và user phải có role **admin**:

```bash
-H "X-User-Id: {userId}"
```

---

## 📁 File Structure

```
backend/
├── controllers/
│   ├── subjectCombinationController.js ✅ NEW
│   └── softSkillController.js ✅ NEW
│
├── routes/
│   ├── subjectCombinationRoutes.js ✅ NEW
│   └── softSkillRoutes.js ✅ NEW
│
└── server.js ✅ UPDATED
```

---

## 🚀 Usage Notes

✅ **Public APIs:**
- Không cần authentication
- Dùng cho frontend hiển thị danh sách lựa chọn

✅ **Admin APIs:**
- Yêu cầu `X-User-Id` header
- User phải có role `admin`
- Dùng cho admin panel quản lý

✅ **Search:**
- Case-insensitive (tìm "a" hay "A" đều được)
- Partial match (tìm "com" sẽ match "Communication")

✅ **Pagination:**
- Default: 10 records/trang
- Max: không giới hạn
- Page: 1-based (page=1 là trang đầu)

---

## ⚠️ Error Handling

| Code | Message | Giải pháp |
|------|---------|-----------|
| 400 | Tên đã tồn tại | Dùng tên khác |
| 400 | Vui lòng cung cấp... | Check required fields |
| 404 | Không tồn tại | Kiểm tra ID |
| 401 | Vui lòng đăng nhập | Thêm X-User-Id |
| 403 | Không có quyền | Chỉ admin mới được |

---

## 💾 Data Schema

### SubjectCombination
```javascript
{
  _id: ObjectId,
  combinationName: String (unique, required),
  subjects: [String] (required, non-empty)
}
```

### SoftSkill
```javascript
{
  _id: ObjectId,
  softSkillName: String (unique, required)
}
```
