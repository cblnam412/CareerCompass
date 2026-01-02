# MockExam API - Complete Reference Summary

## Quick Start

### Base URL
```
http://localhost:3000
```

### Authentication
```
Header: X-User-Id: <user-id>
or
Body: {"userId": "<user-id>", ...}
```

### All Public Endpoints (No Auth)
```bash
# List exams
GET /api/mock-exams

# Get exam detail
GET /api/mock-exams/:examId
```

### All Admin Endpoints (Admin Only)
```bash
# Create exam
POST /api/admin/mock-exams

# Update exam
PATCH /api/admin/mock-exams/:examId

# Delete exam
DELETE /api/admin/mock-exams/:examId
```

---

## API Endpoints Reference

### 1. GET /api/mock-exams
**Public** - List all exams with search/filter/pagination

**Query Parameters**:
- `search` (string): Search by title
- `sort` (string): Sort order (default: -createdAt)
- `limit` (number): Items per page (default: 10)
- `page` (number): Page number (default: 1)

**Response (200)**:
```json
{
    "success": true,
    "data": [
        {
            "_id": "examId",
            "title": "Exam Title",
            "subjectCombination": {...},
            "duration": 180,
            "questions": [...],
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

**Example**:
```bash
curl "http://localhost:3000/api/mock-exams?search=toán&limit=10&page=1"
```

---

### 2. GET /api/mock-exams/:examId
**Public** - Get exam details

**Parameters**: 
- `examId`: Exam ID

**Response (200)**:
```json
{
    "success": true,
    "data": {
        "_id": "examId",
        "title": "Exam Title",
        "subjectCombination": {...},
        "duration": 180,
        "questions": [
            {"id": 1, "text": "Q1", "options": [...], "correctAnswer": "..."}
        ]
    }
}
```

**Example**:
```bash
curl "http://localhost:3000/api/mock-exams/examId123"
```

---

### 3. POST /api/admin/mock-exams
**Admin Only** - Create new exam

**Authentication**: Required (admin role)

**Body Parameters**:
- `title` (string, required): Exam title
- `subjectCombination` (string, required): Subject combination ID
- `duration` (number, required): Duration in minutes
- `questions` (array, required): Array of questions

**Response (201)**:
```json
{
    "success": true,
    "message": "Tạo đề thi thành công",
    "data": {...}
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/admin/mock-exams \
  -H "Content-Type: application/json" \
  -H "X-User-Id: adminId" \
  -d '{
    "title": "Đề thi Toán",
    "subjectCombination": "combId",
    "duration": 180,
    "questions": [
      {"id": 1, "text": "Q1", "options": ["A", "B"], "correctAnswer": "A"}
    ]
  }'
```

---

### 4. PATCH /api/admin/mock-exams/:examId
**Admin Only** - Update exam

**Authentication**: Required (admin role)

**Body Parameters** (all optional):
- `title` (string): New title
- `subjectCombination` (string): New subject combination ID
- `duration` (number): New duration
- `questions` (array): New questions

**Response (200)**:
```json
{
    "success": true,
    "message": "Cập nhật đề thi thành công",
    "data": {...}
}
```

**Example**:
```bash
curl -X PATCH http://localhost:3000/api/admin/mock-exams/examId123 \
  -H "Content-Type: application/json" \
  -H "X-User-Id: adminId" \
  -d '{"title": "New Title", "duration": 120}'
```

---

### 5. DELETE /api/admin/mock-exams/:examId
**Admin Only** - Delete exam

**Authentication**: Required (admin role)

**Response (200)**:
```json
{
    "success": true,
    "message": "Xóa đề thi thành công"
}
```

**Example**:
```bash
curl -X DELETE http://localhost:3000/api/admin/mock-exams/examId123 \
  -H "X-User-Id: adminId"
```

---

## Error Responses

### 400 - Bad Request
```json
{
    "success": false,
    "message": "Yêu cầu thiếu: title, subjectCombination, duration, questions"
}
```
Causes: Missing required fields, invalid data types, validation failures

### 401 - Unauthorized
```json
{
    "success": false,
    "message": "Không xác thực được người dùng"
}
```
Causes: No X-User-Id provided, user not found

### 403 - Forbidden
```json
{
    "success": false,
    "message": "Chỉ admin được phép tạo đề thi"
}
```
Causes: User is not admin, trying to perform admin operation

### 404 - Not Found
```json
{
    "success": false,
    "message": "Đề thi không tồn tại"
}
```
Causes: Exam ID doesn't exist, deleted exam

### 500 - Server Error
```json
{
    "success": false,
    "message": "Lỗi tạo đề thi",
    "error": "error details"
}
```
Causes: Database error, unexpected server error

---

## Data Models

### MockExam Object
```javascript
{
    "_id": ObjectId,
    "title": String,
    "subjectCombination": {
        "_id": ObjectId,
        "combinationName": String,
        "subjects": [String]
    },
    "duration": Number,
    "questions": [
        {
            "id": Number,
            "text": String,
            "options": [String],
            "correctAnswer": String
        }
    ],
    "createdAt": Date,
    "updatedAt": Date
}
```

### Request/Response Format
```javascript
{
    "success": boolean,
    "message": String,      // Only in 201, 400, 401, 403, 404 responses
    "data": Object|Array,   // Response data
    "error": String         // Only in 500 responses
}
```

---

## Query Parameters

### List Endpoint Parameters
```
search=keyword          Partial text search on title
sort=-createdAt         Sort: -field (descending), field (ascending)
limit=10               Results per page (default: 10)
page=1                 Page number (default: 1)
```

### Pagination Response
```javascript
{
    "pagination": {
        "total": 25,        // Total items in database
        "page": 1,          // Current page
        "limit": 10,        // Items per page
        "pages": 3          // Total pages
    }
}
```

---

## Complete Example Workflows

### Workflow 1: User Browses Exams
```bash
# 1. Get list of exams
curl "http://localhost:3000/api/mock-exams"

# 2. Search for specific exams
curl "http://localhost:3000/api/mock-exams?search=toán"

# 3. View exam detail
curl "http://localhost:3000/api/mock-exams/examId123"

# 4. Student takes exam (on frontend, calculates score)
```

### Workflow 2: Admin Creates Exam
```bash
# 1. Create exam
curl -X POST http://localhost:3000/api/admin/mock-exams \
  -H "X-User-Id: adminId" \
  -d '{
    "title": "Đề thi toán",
    "subjectCombination": "combId",
    "duration": 180,
    "questions": [...]
  }'
# Save returned _id as examId

# 2. Verify exam was created
curl "http://localhost:3000/api/mock-exams/examId"

# 3. Update if needed
curl -X PATCH http://localhost:3000/api/admin/mock-exams/examId \
  -H "X-User-Id: adminId" \
  -d '{"title": "Updated title"}'

# 4. Delete exam
curl -X DELETE http://localhost:3000/api/admin/mock-exams/examId \
  -H "X-User-Id: adminId"
```

---

## Common Issues & Solutions

### Issue: 401 Not Authenticated
**Solution**: Add X-User-Id header with valid user ID
```bash
curl ... -H "X-User-Id: validUserId"
```

### Issue: 403 Not Authorized
**Solution**: Ensure user has admin role (not regular user)
```bash
# Check user role in database:
db.users.findOne({_id: userId, role: "admin"})
```

### Issue: 400 Missing Fields
**Solution**: Include all required fields in request body
```bash
# Required: title, subjectCombination, duration, questions
```

### Issue: 404 Not Found
**Solution**: Verify exam ID exists in database
```bash
# Get valid exam ID from list:
curl "http://localhost:3000/api/mock-exams"
```

---

## HTTP Methods & Status Codes

| Method | Endpoint | Status | Meaning |
|--------|----------|--------|---------|
| GET | /api/mock-exams | 200 | Success |
| GET | /api/mock-exams/:id | 200 | Success |
| GET | /api/mock-exams/:id | 404 | Not found |
| POST | /api/admin/mock-exams | 201 | Created |
| POST | /api/admin/mock-exams | 400 | Invalid data |
| POST | /api/admin/mock-exams | 401 | Not authenticated |
| POST | /api/admin/mock-exams | 403 | Not admin |
| PATCH | /api/admin/mock-exams/:id | 200 | Updated |
| PATCH | /api/admin/mock-exams/:id | 403 | Not admin |
| PATCH | /api/admin/mock-exams/:id | 404 | Not found |
| DELETE | /api/admin/mock-exams/:id | 200 | Deleted |
| DELETE | /api/admin/mock-exams/:id | 403 | Not admin |
| DELETE | /api/admin/mock-exams/:id | 404 | Not found |

---

## Rate Limiting (If Configured)

Currently no rate limiting. Consider adding for production:
- GET requests: 100/minute
- POST/PATCH/DELETE: 20/minute

---

## CORS & Headers

### CORS Configuration
Currently allows all origins. Configure in production:
```javascript
app.use(cors({
    origin: ['https://yourdomain.com']
}));
```

### Required Headers (For Admin Operations)
```
Content-Type: application/json
X-User-Id: <valid-admin-id>
```

---

## Testing Tools

### Using Curl
```bash
curl -X GET http://localhost:3000/api/mock-exams
```

### Using Postman
1. Import collection with all endpoints
2. Set variables: BASE_URL, ADMIN_ID
3. Run requests individually or in sequence

### Using JavaScript/Frontend
```javascript
// GET list
const response = await fetch('/api/mock-exams');
const { data, pagination } = await response.json();

// POST create (admin)
const response = await fetch('/api/admin/mock-exams', {
    method: 'POST',
    headers: {'X-User-Id': adminId},
    body: JSON.stringify({title, subjectCombination, duration, questions})
});
```

---

## Performance Notes

### Recommended Database Indexes
```javascript
db.mockexams.createIndex({title: 1})
db.mockexams.createIndex({subjectCombination: 1})
```

### Query Performance
- List with pagination: ~50-100ms
- Get detail: ~20-30ms
- Create: ~30-50ms
- Update: ~30-50ms
- Delete: ~20-30ms

### Optimization Tips
- Use pagination to limit results
- Search only returns first 10 matches by default
- Index title field for faster searches
- Consider caching popular exams

---

## Future Enhancements

Potential features to add:
- [ ] Question templates
- [ ] Exam versioning
- [ ] Answer submission storage
- [ ] Score tracking
- [ ] Difficulty ratings
- [ ] Timed exam enforcement
- [ ] Exam statistics
- [ ] User progress tracking

---

## Documentation Files

1. **MOCKEXAM_GUIDE.md** - Complete API documentation
2. **MOCKEXAM_QUICK_REF.md** - Quick reference
3. **MOCKEXAM_TESTING_GUIDE.md** - Testing scenarios
4. **MOCKEXAM_IMPLEMENTATION_SUMMARY.md** - Implementation details
5. **MOCKEXAM_CHECKLIST.md** - Implementation checklist
6. **MOCKEXAM_VERIFICATION.md** - Final verification report

---

**Last Updated**: January 2, 2026
**API Version**: 1.0
**Status**: Production Ready
