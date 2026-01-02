# MockExam API - Quick Reference

## Endpoint Summary

### Public Endpoints (No Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mock-exams` | Danh sách đề thi (search, sort, phân trang) |
| GET | `/api/mock-exams/:examId` | Chi tiết đề thi |

### Admin Endpoints (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/mock-exams` | Tạo đề thi |
| PATCH | `/api/admin/mock-exams/:examId` | Cập nhật đề thi |
| DELETE | `/api/admin/mock-exams/:examId` | Xóa đề thi |

---

## Common Requests

### Get All Exams
```bash
curl http://localhost:3000/api/mock-exams
```

**Response:**
```json
{
    "success": true,
    "data": [...],
    "pagination": {
        "total": 10,
        "page": 1,
        "limit": 10,
        "pages": 1
    }
}
```

---

### Search Exams
```bash
curl "http://localhost:3000/api/mock-exams?search=toán&limit=10"
```

---

### Get Exam Detail
```bash
curl http://localhost:3000/api/mock-exams/examId123
```

**Response:**
```json
{
    "success": true,
    "data": {
        "_id": "examId123",
        "title": "Đề thi Toán",
        "subjectCombination": {...},
        "duration": 180,
        "questions": [...]
    }
}
```

---

### Create Exam (Admin)
```bash
curl -X POST http://localhost:3000/api/admin/mock-exams \
  -H "Content-Type: application/json" \
  -H "X-User-Id: adminId123" \
  -d '{
    "title": "Đề thi mới",
    "subjectCombination": "combId456",
    "duration": 180,
    "questions": [
      {
        "id": 1,
        "text": "Câu 1?",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A"
      }
    ]
  }'
```

**Response:**
```json
{
    "success": true,
    "message": "Tạo đề thi thành công",
    "data": {...}
}
```

---

### Update Exam (Admin)
```bash
curl -X PATCH http://localhost:3000/api/admin/mock-exams/examId123 \
  -H "Content-Type: application/json" \
  -H "X-User-Id: adminId123" \
  -d '{
    "title": "Tiêu đề mới",
    "duration": 120
  }'
```

---

### Delete Exam (Admin)
```bash
curl -X DELETE http://localhost:3000/api/admin/mock-exams/examId123 \
  -H "X-User-Id: adminId123"
```

**Response:**
```json
{
    "success": true,
    "message": "Xóa đề thi thành công"
}
```

---

## Query Parameters

### List Endpoint
```
?search=keyword          # Tìm kiếm theo tiêu đề
&sort=-createdAt         # Sắp xếp (-createdAt: mới nhất)
&limit=10                # Số items per page (default: 10)
&page=1                  # Trang thứ mấy (default: 1)
```

### Example
```bash
curl "http://localhost:3000/api/mock-exams?search=toán&sort=-createdAt&limit=10&page=1"
```

---

## Authentication

### Pass User ID for Admin Operations:

**Option 1: Header**
```bash
-H "X-User-Id: adminId123"
```

**Option 2: Body**
```json
{"userId": "adminId123", ...}
```

---

## Error Responses

### 401 - Not Authenticated
```json
{"success": false, "message": "Không xác thực được người dùng"}
```

### 403 - Not Admin
```json
{"success": false, "message": "Chỉ admin được phép tạo đề thi"}
```

### 404 - Not Found
```json
{"success": false, "message": "Đề thi không tồn tại"}
```

### 400 - Missing Fields
```json
{"success": false, "message": "Yêu cầu thiếu: title, subjectCombination, duration, questions"}
```

---

## Data Schema

### MockExam
```javascript
{
    _id: ObjectId,
    title: String,
    subjectCombination: ObjectId,  // ref: SubjectCombination
    duration: Number,               // minutes
    questions: [Mixed],             // array of question objects
    createdAt: Date,
    updatedAt: Date
}
```

### Question Object
```javascript
{
    id: Number,
    text: String,
    options: [String],
    correctAnswer: String
}
```

---

## Common Workflows

### Workflow 1: User Browses and Takes Exam
```bash
# 1. List exams
curl http://localhost:3000/api/mock-exams

# 2. View exam
curl http://localhost:3000/api/mock-exams/examId123

# 3. Take exam (handled on frontend)
# Frontend calculates score locally
```

### Workflow 2: Admin Manages Exams
```bash
# 1. Create exam
curl -X POST http://localhost:3000/api/admin/mock-exams \
  -H "X-User-Id: adminId123" \
  -d '...'

# 2. Update if needed
curl -X PATCH http://localhost:3000/api/admin/mock-exams/examId123 \
  -H "X-User-Id: adminId123" \
  -d '{...}'

# 3. Delete old exam
curl -X DELETE http://localhost:3000/api/admin/mock-exams/oldExamId \
  -H "X-User-Id: adminId123"
```

---

## Tips

1. Use `/api/mock-exams` for public list endpoint
2. Use `/api/admin/mock-exams` for admin operations
3. Always include X-User-Id header for admin requests
4. Search supports partial text matching
5. Default limit is 10, max is 50
6. Questions should have consistent structure

---

## Related APIs

- **List Subject Combinations**: `GET /api/subject-combinations`
- **Create Subject Combinations**: `POST /api/admin/subject-combinations`
- **Forum**: `GET /api/forum/posts`

---

## Full Documentation

See **MOCKEXAM_GUIDE.md** for complete API documentation with detailed examples.
