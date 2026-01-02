# MockExam CRUD - Testing Guide

## Prerequisites

- MongoDB running and connected
- Node.js server running
- Valid admin user ID in database
- Valid subject combination ID

---

## Test Setup

### 1. Get Admin User ID

Use existing admin or create one:
```bash
# If you have admin user
ADMIN_ID="<admin-user-id>"

# Or get from your database
# db.users.findOne({ role: "admin" })
```

### 2. Get Subject Combination ID

```bash
# Get existing subject combination
curl "http://localhost:3000/api/subject-combinations"

# Save any ID as
COMB_ID="<subject-combination-id>"
```

---

## Test Scenarios

## 1️⃣ Public Endpoints - Get Exams

### Test 1.1: Get All Exams (Empty)

```bash
curl http://localhost:3000/api/mock-exams
```

**Expected Response** (200):
```json
{
    "success": true,
    "data": [],
    "pagination": {
        "total": 0,
        "page": 1,
        "limit": 10,
        "pages": 0
    }
}
```

---

## 2️⃣ Admin Endpoints - Create Exam

### Test 2.1: Create Exam (Success)

```bash
curl -X POST http://localhost:3000/api/admin/mock-exams \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $ADMIN_ID" \
  -d '{
    "title": "Đề thi Toán khối A năm 2024",
    "subjectCombination": "'$COMB_ID'",
    "duration": 180,
    "questions": [
      {
        "id": 1,
        "text": "Giải phương trình: x + 2 = 5",
        "options": ["x = 1", "x = 2", "x = 3", "x = 4"],
        "correctAnswer": "x = 3"
      },
      {
        "id": 2,
        "text": "2 + 2 = ?",
        "options": ["3", "4", "5", "6"],
        "correctAnswer": "4"
      }
    ]
  }'
```

**Expected Response** (201):
```json
{
    "success": true,
    "message": "Tạo đề thi thành công",
    "data": {
        "_id": "examId123",
        "title": "Đề thi Toán khối A năm 2024",
        "subjectCombination": {...},
        "duration": 180,
        "questions": [...]
    }
}
```

**Save**: `EXAM_ID_1="examId123"`

---

### Test 2.2: Create Exam Without Auth (Should Fail)

```bash
curl -X POST http://localhost:3000/api/admin/mock-exams \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "subjectCombination": "'$COMB_ID'",
    "duration": 180,
    "questions": [{"id": 1, "text": "Q1"}]
  }'
```

**Expected Response** (401):
```json
{
    "success": false,
    "message": "Không xác thực được người dùng"
}
```

---

### Test 2.3: Create Exam With Non-Admin User (Should Fail)

First create a regular user:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Regular User",
    "email": "regular@test.com",
    "password": "password123",
    "dateOfBirth": "2005-01-01",
    "address": "Hà Nội"
  }'
```

Save userId as USER_ID, then try to create exam:
```bash
curl -X POST http://localhost:3000/api/admin/mock-exams \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_ID" \
  -d '{
    "title": "Test",
    "subjectCombination": "'$COMB_ID'",
    "duration": 180,
    "questions": [{"id": 1}]
  }'
```

**Expected Response** (403):
```json
{
    "success": false,
    "message": "Chỉ admin được phép tạo đề thi"
}
```

---

### Test 2.4: Create Exam Missing Title (Should Fail)

```bash
curl -X POST http://localhost:3000/api/admin/mock-exams \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $ADMIN_ID" \
  -d '{
    "subjectCombination": "'$COMB_ID'",
    "duration": 180,
    "questions": [{"id": 1}]
  }'
```

**Expected Response** (400):
```json
{
    "success": false,
    "message": "Yêu cầu thiếu: title, subjectCombination, duration, questions"
}
```

---

### Test 2.5: Create Exam With Invalid Duration

```bash
curl -X POST http://localhost:3000/api/admin/mock-exams \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $ADMIN_ID" \
  -d '{
    "title": "Test",
    "subjectCombination": "'$COMB_ID'",
    "duration": -5,
    "questions": [{"id": 1}]
  }'
```

**Expected Response** (400):
```json
{
    "success": false,
    "message": "Thời gian làm bài phải là số dương"
}
```

---

### Test 2.6: Create Exam With Empty Questions Array

```bash
curl -X POST http://localhost:3000/api/admin/mock-exams \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $ADMIN_ID" \
  -d '{
    "title": "Test",
    "subjectCombination": "'$COMB_ID'",
    "duration": 180,
    "questions": []
  }'
```

**Expected Response** (400):
```json
{
    "success": false,
    "message": "Đề thi phải có ít nhất 1 câu hỏi"
}
```

---

### Test 2.7: Create Exam With Invalid SubjectCombination

```bash
curl -X POST http://localhost:3000/api/admin/mock-exams \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $ADMIN_ID" \
  -d '{
    "title": "Test",
    "subjectCombination": "invalidId",
    "duration": 180,
    "questions": [{"id": 1}]
  }'
```

**Expected Response** (400):
```json
{
    "success": false,
    "message": "Tổ hợp môn không tồn tại"
}
```

---

## 3️⃣ Public Endpoints - Get Exams (After Create)

### Test 3.1: Get All Exams

```bash
curl http://localhost:3000/api/mock-exams
```

**Expected Response** (200):
```json
{
    "success": true,
    "data": [
        {
            "_id": "examId123",
            "title": "Đề thi Toán khối A năm 2024",
            "subjectCombination": {...},
            "duration": 180,
            "questions": [...]
        }
    ],
    "pagination": {
        "total": 1,
        "page": 1,
        "limit": 10,
        "pages": 1
    }
}
```

---

### Test 3.2: Search Exams

```bash
curl "http://localhost:3000/api/mock-exams?search=toán"
```

**Expected**: Returns exam with "toán" in title

---

### Test 3.3: Search with No Results

```bash
curl "http://localhost:3000/api/mock-exams?search=không%20tồn%20tại"
```

**Expected**: Empty data array

---

### Test 3.4: Get Exam Detail

```bash
curl http://localhost:3000/api/mock-exams/$EXAM_ID_1
```

**Expected Response** (200):
```json
{
    "success": true,
    "data": {
        "_id": "examId123",
        "title": "Đề thi Toán khối A năm 2024",
        "subjectCombination": {...},
        "duration": 180,
        "questions": [
            {
                "id": 1,
                "text": "Giải phương trình: x + 2 = 5",
                "options": ["x = 1", "x = 2", "x = 3", "x = 4"],
                "correctAnswer": "x = 3"
            },
            {
                "id": 2,
                "text": "2 + 2 = ?",
                "options": ["3", "4", "5", "6"],
                "correctAnswer": "4"
            }
        ]
    }
}
```

---

### Test 3.5: Get Non-Existent Exam (Should Fail)

```bash
curl http://localhost:3000/api/mock-exams/invalidId123
```

**Expected Response** (404):
```json
{
    "success": false,
    "message": "Đề thi không tồn tại"
}
```

---

## 4️⃣ Admin Endpoints - Update Exam

### Test 4.1: Update Exam Title

```bash
curl -X PATCH http://localhost:3000/api/admin/mock-exams/$EXAM_ID_1 \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $ADMIN_ID" \
  -d '{
    "title": "Đề thi Toán khối A năm 2024 (Phiên bản mới)"
  }'
```

**Expected Response** (200):
```json
{
    "success": true,
    "message": "Cập nhật đề thi thành công",
    "data": {
        "_id": "examId123",
        "title": "Đề thi Toán khối A năm 2024 (Phiên bản mới)",
        "duration": 180,
        "updatedAt": "2024-01-15T12:30:00Z"
    }
}
```

---

### Test 4.2: Update Duration

```bash
curl -X PATCH http://localhost:3000/api/admin/mock-exams/$EXAM_ID_1 \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $ADMIN_ID" \
  -d '{"duration": 120}'
```

**Expected**: Returns updated exam with duration = 120

---

### Test 4.3: Update Questions

```bash
curl -X PATCH http://localhost:3000/api/admin/mock-exams/$EXAM_ID_1 \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $ADMIN_ID" \
  -d '{
    "questions": [
      {
        "id": 1,
        "text": "Câu hỏi mới",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "B"
      }
    ]
  }'
```

**Expected**: Returns updated exam with new questions

---

### Test 4.4: Update Without Auth (Should Fail)

```bash
curl -X PATCH http://localhost:3000/api/admin/mock-exams/$EXAM_ID_1 \
  -H "Content-Type: application/json" \
  -d '{"title": "New title"}'
```

**Expected Response** (401):
```json
{
    "success": false,
    "message": "Không xác thực được người dùng"
}
```

---

### Test 4.5: Update With Non-Admin User (Should Fail)

```bash
curl -X PATCH http://localhost:3000/api/admin/mock-exams/$EXAM_ID_1 \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_ID" \
  -d '{"title": "Hack"}'
```

**Expected Response** (403):
```json
{
    "success": false,
    "message": "Chỉ admin được phép cập nhật đề thi"
}
```

---

### Test 4.6: Update Non-Existent Exam (Should Fail)

```bash
curl -X PATCH http://localhost:3000/api/admin/mock-exams/invalidId \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $ADMIN_ID" \
  -d '{"title": "New"}'
```

**Expected Response** (404):
```json
{
    "success": false,
    "message": "Đề thi không tồn tại"
}
```

---

### Test 4.7: Update With Invalid Duration

```bash
curl -X PATCH http://localhost:3000/api/admin/mock-exams/$EXAM_ID_1 \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $ADMIN_ID" \
  -d '{"duration": 0}'
```

**Expected Response** (400):
```json
{
    "success": false,
    "message": "Thời gian làm bài phải là số dương"
}
```

---

## 5️⃣ Admin Endpoints - Delete Exam

### Test 5.1: Delete Exam (Success)

```bash
curl -X DELETE http://localhost:3000/api/admin/mock-exams/$EXAM_ID_1 \
  -H "X-User-Id: $ADMIN_ID"
```

**Expected Response** (200):
```json
{
    "success": true,
    "message": "Xóa đề thi thành công"
}
```

---

### Test 5.2: Verify Exam is Deleted

```bash
curl http://localhost:3000/api/mock-exams/$EXAM_ID_1
```

**Expected Response** (404):
```json
{
    "success": false,
    "message": "Đề thi không tồn tại"
}
```

---

### Test 5.3: Delete Without Auth (Should Fail)

First create another exam:
```bash
curl -X POST http://localhost:3000/api/admin/mock-exams \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $ADMIN_ID" \
  -d '{
    "title": "Test Delete",
    "subjectCombination": "'$COMB_ID'",
    "duration": 180,
    "questions": [{"id": 1}]
  }'
```

Save as EXAM_ID_2, then try to delete without auth:
```bash
curl -X DELETE http://localhost:3000/api/admin/mock-exams/$EXAM_ID_2
```

**Expected Response** (401):
```json
{
    "success": false,
    "message": "Không xác thực được người dùng"
}
```

---

### Test 5.4: Delete With Non-Admin User (Should Fail)

```bash
curl -X DELETE http://localhost:3000/api/admin/mock-exams/$EXAM_ID_2 \
  -H "X-User-Id: $USER_ID"
```

**Expected Response** (403):
```json
{
    "success": false,
    "message": "Chỉ admin được phép xóa đề thi"
}
```

---

### Test 5.5: Delete Non-Existent Exam (Should Fail)

```bash
curl -X DELETE http://localhost:3000/api/admin/mock-exams/invalidId \
  -H "X-User-Id: $ADMIN_ID"
```

**Expected Response** (404):
```json
{
    "success": false,
    "message": "Đề thi không tồn tại"
}
```

---

## 6️⃣ Complex Scenarios

### Scenario 1: Full Exam Lifecycle

```bash
# 1. Create exam
EXAM=$(curl -s -X POST http://localhost:3000/api/admin/mock-exams \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $ADMIN_ID" \
  -d '{
    "title": "Đề thi Lịch sử",
    "subjectCombination": "'$COMB_ID'",
    "duration": 120,
    "questions": [
      {"id": 1, "text": "Năm thành lập ĐCS Việt Nam?", "correctAnswer": "1930"},
      {"id": 2, "text": "Người sáng lập ĐCS Việt Nam?", "correctAnswer": "Hồ Chí Minh"}
    ]
  }')

EXAM_ID=$(echo $EXAM | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)

# 2. User views exam
curl http://localhost:3000/api/mock-exams/$EXAM_ID

# 3. Admin updates exam
curl -X PATCH http://localhost:3000/api/admin/mock-exams/$EXAM_ID \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $ADMIN_ID" \
  -d '{"title": "Đề thi Lịch sử - Năm 2024"}'

# 4. Verify update
curl http://localhost:3000/api/mock-exams/$EXAM_ID

# 5. Delete exam
curl -X DELETE http://localhost:3000/api/admin/mock-exams/$EXAM_ID \
  -H "X-User-Id: $ADMIN_ID"
```

---

### Scenario 2: Multiple Exams

```bash
# Create 3 exams
for i in 1 2 3; do
  curl -X POST http://localhost:3000/api/admin/mock-exams \
    -H "Content-Type: application/json" \
    -H "X-User-Id: $ADMIN_ID" \
    -d '{
      "title": "Đề thi tập luyện '$i'",
      "subjectCombination": "'$COMB_ID'",
      "duration": 120,
      "questions": [{"id": '$i'", "text": "Câu '$i'"}]
    }' &
done
wait

# List all exams
curl http://localhost:3000/api/mock-exams

# Search
curl "http://localhost:3000/api/mock-exams?search=tập%20luyện"

# Paginate
curl "http://localhost:3000/api/mock-exams?limit=2&page=1"
```

---

## Testing Checklist

| # | Test | Expected | Status |
|---|------|----------|--------|
| 1.1 | Get all (empty) | 200, empty | [ ] |
| 2.1 | Create exam | 201 | [ ] |
| 2.2 | Create without auth | 401 | [ ] |
| 2.3 | Create non-admin | 403 | [ ] |
| 2.4 | Create missing fields | 400 | [ ] |
| 2.5 | Create invalid duration | 400 | [ ] |
| 2.6 | Create empty questions | 400 | [ ] |
| 2.7 | Create invalid subject | 400 | [ ] |
| 3.1 | Get all exams | 200, list | [ ] |
| 3.2 | Search exams | 200, filtered | [ ] |
| 3.3 | Search no results | 200, empty | [ ] |
| 3.4 | Get exam detail | 200, detail | [ ] |
| 3.5 | Get non-existent | 404 | [ ] |
| 4.1 | Update title | 200, updated | [ ] |
| 4.2 | Update duration | 200, updated | [ ] |
| 4.3 | Update questions | 200, updated | [ ] |
| 4.4 | Update without auth | 401 | [ ] |
| 4.5 | Update non-admin | 403 | [ ] |
| 4.6 | Update non-existent | 404 | [ ] |
| 4.7 | Update invalid duration | 400 | [ ] |
| 5.1 | Delete exam | 200 | [ ] |
| 5.2 | Verify deleted | 404 | [ ] |
| 5.3 | Delete without auth | 401 | [ ] |
| 5.4 | Delete non-admin | 403 | [ ] |
| 5.5 | Delete non-existent | 404 | [ ] |
| 6.1 | Full lifecycle | All ✓ | [ ] |
| 6.2 | Multiple exams | All ✓ | [ ] |

---

## Debugging Tips

### If Getting 401
- Check admin user ID is valid and exists in database
- Verify user has "admin" role
- Check X-User-Id header is present

### If Getting 403
- Verify user role is "admin"
- Check user wasn't promoted to admin role after registration

### If Getting 404
- Verify exam ID exists
- Check database has exam with that ID
- Ensure ID format is valid ObjectId

### If Getting 400
- Check all required fields present
- Verify questions is non-empty array
- Verify duration is positive number
- Check subject combination ID exists

### If Getting 500
- Check server logs for error
- Verify MongoDB connection
- Check models are properly defined

---

## Performance Testing

### Load Test: Create 50 Exams

```bash
#!/bin/bash
for i in {1..50}; do
  curl -X POST http://localhost:3000/api/admin/mock-exams \
    -H "Content-Type: application/json" \
    -H "X-User-Id: $ADMIN_ID" \
    -d '{
      "title": "Load test exam '$i'",
      "subjectCombination": "'$COMB_ID'",
      "duration": 120,
      "questions": [{"id": '$i'", "text": "Question '$i'"}]
    }' &
done
wait

# List to verify
curl http://localhost:3000/api/mock-exams?limit=50
```

---

**Testing Status**: Ready to execute
**Created**: January 15, 2024
