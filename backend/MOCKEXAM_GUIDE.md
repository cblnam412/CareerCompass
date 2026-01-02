# MockExam API Documentation

**Base URL**: `http://localhost:3000/api`

## Overview

MockExam hệ thống cho phép lưu trữ và quản lý các đề thi mô phỏng theo các tổ hợp môn khác nhau. Sinh viên có thể xem danh sách đề thi và làm bài thi, trong khi admin quản lý tạo/sửa/xóa đề thi.

### Features:
- ✅ Danh sách đề thi với tìm kiếm
- ✅ Xem chi tiết đề thi (công khai)
- ✅ Tạo/sửa/xóa đề thi (admin only)
- ✅ Liên kết với tổ hợp môn (SubjectCombination)
- ✅ Quản lý câu hỏi (Mixed data type)
- ✅ Tính năng tìm kiếm theo tiêu đề
- ✅ Phân trang

---

## Public Endpoints

### 1. GET `/mock-exams` - Lấy danh sách đề thi

**Description**: Lấy danh sách tất cả đề thi (công khai, không cần auth)

**Parameters**:
```
Query Parameters:
- search (string, optional): Tìm kiếm theo tiêu đề
- sort (string, optional): Sắp xếp (-createdAt = mới nhất, createdAt = cũ nhất)
- limit (number, optional): Số lượng trên một trang (default: 10)
- page (number, optional): Trang thứ mấy (default: 1)
```

**Example Request**:
```bash
GET /api/mock-exams?search=toán&sort=-createdAt&limit=10&page=1
```

**Success Response** (200):
```json
{
    "success": true,
    "data": [
        {
            "_id": "507f1f77bcf86cd799439011",
            "title": "Đề thi toán khối A năm 2024",
            "subjectCombination": {
                "_id": "507f1f77bcf86cd799439012",
                "combinationName": "A00",
                "subjects": ["Toán", "Vật lý", "Hóa học"]
            },
            "duration": 180,
            "questions": [
                {
                    "id": 1,
                    "text": "Câu hỏi 1",
                    "options": ["A", "B", "C", "D"],
                    "correctAnswer": "A"
                }
            ],
            "createdAt": "2024-01-15T10:30:00Z",
            "updatedAt": "2024-01-15T10:30:00Z"
        }
    ],
    "pagination": {
        "total": 25,
        "page": 1,
        "limit": 10,
        "pages": 3
    }
}
```

**Error Response** (500):
```json
{
    "success": false,
    "message": "Lỗi lấy danh sách đề thi"
}
```

---

### 2. GET `/mock-exams/:examId` - Lấy chi tiết đề thi

**Description**: Lấy chi tiết đề thi (công khai)

**Parameters**:
```
Path Parameters:
- examId (string): ID của đề thi
```

**Example Request**:
```bash
GET /api/mock-exams/507f1f77bcf86cd799439011
```

**Success Response** (200):
```json
{
    "success": true,
    "data": {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Đề thi toán khối A năm 2024",
        "subjectCombination": {
            "_id": "507f1f77bcf86cd799439012",
            "combinationName": "A00",
            "subjects": ["Toán", "Vật lý", "Hóa học"]
        },
        "duration": 180,
        "questions": [
            {
                "id": 1,
                "text": "Giải phương trình x + 2 = 5",
                "options": ["x = 1", "x = 2", "x = 3", "x = 4"],
                "correctAnswer": "x = 3"
            },
            {
                "id": 2,
                "text": "Câu hỏi 2",
                "options": ["A", "B", "C", "D"],
                "correctAnswer": "B"
            }
        ],
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
    }
}
```

**Error Response** (404):
```json
{
    "success": false,
    "message": "Đề thi không tồn tại"
}
```

---

## Admin Endpoints

### 3. POST `/admin/mock-exams` - Tạo đề thi mới

**Description**: Tạo đề thi mới (admin only)

**Parameters**:
```
Header:
- X-User-Id (string): ID của admin
OR
Body:
- userId (string): ID của admin

Body:
- title (string, required): Tiêu đề đề thi
- subjectCombination (string, required): ID tổ hợp môn
- duration (number, required): Thời gian làm bài (phút)
- questions (array, required): Mảng câu hỏi
```

**Example Request**:
```bash
POST /api/admin/mock-exams
Content-Type: application/json
X-User-Id: 507f1f77bcf86cd799439012

{
    "title": "Đề thi toán khối A năm 2024",
    "subjectCombination": "507f1f77bcf86cd799439013",
    "duration": 180,
    "questions": [
        {
            "id": 1,
            "text": "Câu 1: Giải phương trình x + 2 = 5",
            "options": ["x = 1", "x = 2", "x = 3", "x = 4"],
            "correctAnswer": "x = 3"
        },
        {
            "id": 2,
            "text": "Câu 2: 2 + 2 = ?",
            "options": ["3", "4", "5", "6"],
            "correctAnswer": "4"
        }
    ]
}
```

**Success Response** (201):
```json
{
    "success": true,
    "message": "Tạo đề thi thành công",
    "data": {
        "_id": "507f1f77bcf86cd799439014",
        "title": "Đề thi toán khối A năm 2024",
        "subjectCombination": {
            "_id": "507f1f77bcf86cd799439013",
            "combinationName": "A00",
            "subjects": ["Toán", "Vật lý", "Hóa học"]
        },
        "duration": 180,
        "questions": [
            {
                "id": 1,
                "text": "Câu 1: Giải phương trình x + 2 = 5",
                "options": ["x = 1", "x = 2", "x = 3", "x = 4"],
                "correctAnswer": "x = 3"
            },
            {
                "id": 2,
                "text": "Câu 2: 2 + 2 = ?",
                "options": ["3", "4", "5", "6"],
                "correctAnswer": "4"
            }
        ],
        "createdAt": "2024-01-15T11:00:00Z",
        "updatedAt": "2024-01-15T11:00:00Z"
    }
}
```

**Error Response** (400 - Missing Fields):
```json
{
    "success": false,
    "message": "Yêu cầu thiếu: title, subjectCombination, duration, questions"
}
```

**Error Response** (401 - Not Authenticated):
```json
{
    "success": false,
    "message": "Không xác thực được người dùng"
}
```

**Error Response** (403 - Not Admin):
```json
{
    "success": false,
    "message": "Chỉ admin được phép tạo đề thi"
}
```

---

### 4. PATCH `/admin/mock-exams/:examId` - Cập nhật đề thi

**Description**: Cập nhật đề thi (admin only)

**Parameters**:
```
Path Parameters:
- examId (string): ID của đề thi

Header:
- X-User-Id (string): ID của admin

Body (có thể cập nhật một phần):
- title (string, optional)
- subjectCombination (string, optional)
- duration (number, optional)
- questions (array, optional)
```

**Example Request**:
```bash
PATCH /api/admin/mock-exams/507f1f77bcf86cd799439014
Content-Type: application/json
X-User-Id: 507f1f77bcf86cd799439012

{
    "title": "Đề thi toán khối A năm 2024 (Cập nhật)",
    "duration": 120,
    "questions": [
        {
            "id": 1,
            "text": "Câu 1 cập nhật",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": "A"
        }
    ]
}
```

**Success Response** (200):
```json
{
    "success": true,
    "message": "Cập nhật đề thi thành công",
    "data": {
        "_id": "507f1f77bcf86cd799439014",
        "title": "Đề thi toán khối A năm 2024 (Cập nhật)",
        "subjectCombination": {
            "_id": "507f1f77bcf86cd799439013",
            "combinationName": "A00",
            "subjects": ["Toán", "Vật lý", "Hóa học"]
        },
        "duration": 120,
        "questions": [
            {
                "id": 1,
                "text": "Câu 1 cập nhật",
                "options": ["A", "B", "C", "D"],
                "correctAnswer": "A"
            }
        ],
        "updatedAt": "2024-01-15T11:30:00Z"
    }
}
```

**Error Response** (403 - Not Admin):
```json
{
    "success": false,
    "message": "Chỉ admin được phép cập nhật đề thi"
}
```

**Error Response** (404 - Not Found):
```json
{
    "success": false,
    "message": "Đề thi không tồn tại"
}
```

---

### 5. DELETE `/admin/mock-exams/:examId` - Xóa đề thi

**Description**: Xóa đề thi (admin only)

**Parameters**:
```
Path Parameters:
- examId (string): ID của đề thi

Header:
- X-User-Id (string): ID của admin
```

**Example Request**:
```bash
DELETE /api/admin/mock-exams/507f1f77bcf86cd799439014
X-User-Id: 507f1f77bcf86cd799439012
```

**Success Response** (200):
```json
{
    "success": true,
    "message": "Xóa đề thi thành công"
}
```

**Error Response** (403 - Not Admin):
```json
{
    "success": false,
    "message": "Chỉ admin được phép xóa đề thi"
}
```

**Error Response** (404 - Not Found):
```json
{
    "success": false,
    "message": "Đề thi không tồn tại"
}
```

---

## Error Codes

| Code | Message | Meaning |
|------|---------|---------|
| 400 | Missing required fields | Thiếu trường bắt buộc |
| 401 | User not authenticated | Không xác thực được người dùng |
| 403 | Not authorized | Không có quyền thực hiện hành động |
| 404 | Not found | Đề thi không tồn tại |
| 500 | Server error | Lỗi máy chủ |

---

## Database Schema Reference

### MockExam Collection
```javascript
{
    _id: ObjectId,
    title: String (required),
    subjectCombination: ObjectId (ref: SubjectCombination, required),
    duration: Number (required, minutes),
    questions: [Mixed] (required, array of question objects),
    createdAt: Date,
    updatedAt: Date
}
```

### Question Object Structure (Example)
```javascript
{
    id: Number,
    text: String,
    options: [String],
    correctAnswer: String,
    // Additional fields can be added as needed
}
```

---

## Usage Examples

### Example 1: Browse and Take Mock Exam

```bash
# 1. Get list of exams
curl "http://localhost:3000/api/mock-exams?search=toán"

# 2. Get exam details
curl http://localhost:3000/api/mock-exams/examId123

# 3. Student takes the exam (locally handled on frontend)
# Frontend sends answers and calculates score
```

### Example 2: Admin Creates Exam

```bash
# 1. Create new mock exam
curl -X POST http://localhost:3000/api/admin/mock-exams \
  -H "Content-Type: application/json" \
  -H "X-User-Id: adminId123" \
  -d '{
    "title": "Đề thi Tiếng Anh khối D năm 2024",
    "subjectCombination": "combId456",
    "duration": 120,
    "questions": [
      {
        "id": 1,
        "text": "Question text here",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A"
      }
    ]
  }'

# 2. Update exam if needed
curl -X PATCH http://localhost:3000/api/admin/mock-exams/examId123 \
  -H "Content-Type: application/json" \
  -H "X-User-Id: adminId123" \
  -d '{"title": "Updated title"}'

# 3. Delete exam
curl -X DELETE http://localhost:3000/api/admin/mock-exams/examId123 \
  -H "X-User-Id: adminId123"
```

### Example 3: Search and Filter

```bash
# Search by keyword
curl "http://localhost:3000/api/mock-exams?search=khối%20A"

# Sort by newest
curl "http://localhost:3000/api/mock-exams?sort=-createdAt"

# Pagination
curl "http://localhost:3000/api/mock-exams?limit=5&page=2"

# Combine filters
curl "http://localhost:3000/api/mock-exams?search=toán&limit=20&page=1"
```

---

## Best Practices

1. **Question Structure** - Maintain consistent structure for questions across exams
2. **Duration** - Set realistic exam durations in minutes
3. **Search Before Create** - Check if exam already exists before creating
4. **Admin Only** - Ensure only admins can modify exams
5. **Validation** - Always validate questions array before creation

---

## Frontend Integration Notes

```javascript
// Get exams list
async function getExams() {
    const response = await fetch('/api/mock-exams?search=&limit=10&page=1');
    const { data, pagination } = await response.json();
    return { exams: data, pagination };
}

// Get exam details
async function getExamDetail(examId) {
    const response = await fetch(`/api/mock-exams/${examId}`);
    const { data } = await response.json();
    return data;
}

// Admin create exam
async function createExam(examData) {
    const response = await fetch('/api/admin/mock-exams', {
        method: 'POST',
        headers: { 'X-User-Id': userId },
        body: JSON.stringify(examData)
    });
    return response.json();
}

// Admin update exam
async function updateExam(examId, updates) {
    const response = await fetch(`/api/admin/mock-exams/${examId}`, {
        method: 'PATCH',
        headers: { 'X-User-Id': userId },
        body: JSON.stringify(updates)
    });
    return response.json();
}

// Admin delete exam
async function deleteExam(examId) {
    const response = await fetch(`/api/admin/mock-exams/${examId}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': userId }
    });
    return response.json();
}
```

---

## Related Resources

- **Subject Combinations**: [SubjectCombination API](./CRUD_GUIDE.md)
- **Forum**: [Forum API](./FORUM_GUIDE.md)
- **Admin Management**: [Admin Guide](./ADMIN_MANAGEMENT_GUIDE.md)
