# Forum System - Testing Guide

## Prerequisites

- MongoDB running locally or remote connection configured
- Node.js server running (`npm start` or `node server.js`)
- Valid User IDs in database (from registration)
- Postman or curl installed

---

## Test Setup

### 1. Create Test Users (if not exists)

Use registration endpoints to create test users:

```bash
# Create User 1
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyễn Văn A",
    "email": "userA@test.com",
    "password": "password123",
    "dateOfBirth": "2005-01-15",
    "address": "Hà Nội"
  }'

# Response includes userId, save it as USER_A_ID

# Create User 2
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Trần Thị B",
    "email": "userB@test.com",
    "password": "password123",
    "dateOfBirth": "2005-02-20",
    "address": "TP.HCM"
  }'

# Response includes userId, save it as USER_B_ID
```

### 2. Environment Variables (for testing)

Save in a test file or terminal:
```bash
USER_A_ID="<paste userId from response 1>"
USER_B_ID="<paste userId from response 2>"
BASE_URL="http://localhost:3000"
```

---

## Test Scenarios

## 1️⃣ Forum Posts - Create & List

### Test 1.1: Create First Post

```bash
curl -X POST $BASE_URL/api/forum/posts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_A_ID" \
  -d '{
    "title": "Cách chọn ngành Khoa học Dữ liệu",
    "content": "Mình đang cân nhắc giữa Khoa học Dữ liệu và Công nghệ Thông tin. Có ai có kinh nghiệm không?",
    "itemUrl": "https://example.com/major-info"
  }'
```

**Expected Response (201)**:
```json
{
    "success": true,
    "message": "Tạo bài viết thành công",
    "data": {
        "_id": "<post-id-1>",
        "authorId": "<USER_A_ID>",
        "title": "Cách chọn ngành Khoa học Dữ liệu",
        "content": "Mình đang cân nhắc giữa...",
        "commentCount": 0,
        "status": "active",
        "upvotes": 0,
        "createdAt": "2024-01-15T12:00:00Z"
    }
}
```

**Save**: `POST_ID_1="<_id from response>"`

---

### Test 1.2: Create Second Post (Different User)

```bash
curl -X POST $BASE_URL/api/forum/posts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_B_ID" \
  -d '{
    "title": "Kinh nghiệm chuẩn bị thi đại học",
    "content": "Mình vừa thi xong, muốn chia sẻ kinh nghiệm với các bạn.",
    "relatedMajorIds": ["majorId1", "majorId2"]
  }'
```

**Expected**: 201 Created

---

### Test 1.3: Create Post Without Auth (Should Fail)

```bash
curl -X POST $BASE_URL/api/forum/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "No auth post",
    "content": "This should fail"
  }'
```

**Expected Response (401)**:
```json
{
    "success": false,
    "message": "Không xác thực được người dùng"
}
```

---

### Test 1.4: Create Post Missing Title (Should Fail)

```bash
curl -X POST $BASE_URL/api/forum/posts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_A_ID" \
  -d '{
    "content": "Missing title"
  }'
```

**Expected Response (400)**:
```json
{
    "success": false,
    "message": "Yêu cầu thiếu 'title' hoặc 'content'"
}
```

---

### Test 1.5: Get All Posts

```bash
curl "$BASE_URL/api/forum/posts"
```

**Expected Response (200)**:
```json
{
    "success": true,
    "data": [
        {
            "_id": "<post-id-1>",
            "authorId": {
                "_id": "<USER_A_ID>",
                "fullName": "Nguyễn Văn A"
            },
            "title": "Cách chọn ngành Khoa học Dữ liệu",
            "commentCount": 0,
            "status": "active",
            "upvotes": 0,
            "createdAt": "2024-01-15T12:00:00Z"
        },
        ...
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "totalResults": 2
    }
}
```

---

### Test 1.6: Search Posts

```bash
curl "$BASE_URL/api/forum/posts?search=python"
```

**Expected**: Returns posts with "python" in title or content

---

### Test 1.7: Filter by Status

```bash
curl "$BASE_URL/api/forum/posts?status=active"
```

**Expected**: Returns only active posts

---

### Test 1.8: Sort by Upvotes

```bash
curl "$BASE_URL/api/forum/posts?sort=-upvotes"
```

**Expected**: Posts sorted by most upvoted first

---

### Test 1.9: Pagination

```bash
curl "$BASE_URL/api/forum/posts?limit=1&page=1"
```

**Expected**: Returns 1 post per page, pagination info shows 2 pages

---

## 2️⃣ Forum Posts - Details & Operations

### Test 2.1: Get Post Detail

```bash
curl "$BASE_URL/api/forum/posts/$POST_ID_1"
```

**Expected Response (200)**:
```json
{
    "success": true,
    "data": {
        "_id": "<post-id-1>",
        "authorId": {
            "_id": "<USER_A_ID>",
            "fullName": "Nguyễn Văn A"
        },
        "title": "Cách chọn ngành Khoa học Dữ liệu",
        "content": "...",
        "commentCount": 0,
        "status": "active",
        "upvotes": 0,
        "comments": []
    }
}
```

---

### Test 2.2: Get Non-Existent Post (Should Fail)

```bash
curl "$BASE_URL/api/forum/posts/invalid-id"
```

**Expected Response (404)**:
```json
{
    "success": false,
    "message": "Bài viết không tồn tại"
}
```

---

### Test 2.3: Update Own Post

```bash
curl -X PATCH "$BASE_URL/api/forum/posts/$POST_ID_1" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_A_ID" \
  -d '{
    "content": "Updated content - Có thêm một số điểm cần chú ý",
    "status": "resolved"
  }'
```

**Expected Response (200)**:
```json
{
    "success": true,
    "message": "Cập nhật bài viết thành công",
    "data": {
        "_id": "<post-id-1>",
        "content": "Updated content - Có thêm một số điểm cần chú ý",
        "status": "resolved",
        "updatedAt": "2024-01-15T13:00:00Z"
    }
}
```

---

### Test 2.4: Update Other User's Post (Should Fail)

```bash
curl -X PATCH "$BASE_URL/api/forum/posts/$POST_ID_1" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_B_ID" \
  -d '{"content": "Hacking attempt"}'
```

**Expected Response (403)**:
```json
{
    "success": false,
    "message": "Bạn không có quyền chỉnh sửa bài viết này"
}
```

---

### Test 2.5: Upvote Post

```bash
curl -X PATCH "$BASE_URL/api/forum/posts/$POST_ID_1/upvote" \
  -H "X-User-Id: $USER_B_ID"
```

**Expected Response (200)**:
```json
{
    "success": true,
    "message": "Cập nhật upvote thành công",
    "data": {
        "upvotes": 1
    }
}
```

---

### Test 2.6: Upvote Again (Toggle Off)

```bash
curl -X PATCH "$BASE_URL/api/forum/posts/$POST_ID_1/upvote" \
  -H "X-User-Id: $USER_B_ID"
```

**Expected**: Returns `"upvotes": 0` (upvote removed)

---

### Test 2.7: Delete Own Post

```bash
curl -X DELETE "$BASE_URL/api/forum/posts/$POST_ID_1" \
  -H "X-User-Id: $USER_A_ID"
```

**Expected Response (200)**:
```json
{
    "success": true,
    "message": "Xóa bài viết thành công"
}
```

---

### Test 2.8: Delete Other User's Post (Should Fail)

First recreate POST_ID_1, then try:

```bash
curl -X DELETE "$BASE_URL/api/forum/posts/$POST_ID_1" \
  -H "X-User-Id: $USER_B_ID"
```

**Expected Response (403)**:
```json
{
    "success": false,
    "message": "Bạn không có quyền xóa bài viết này"
}
```

---

## 3️⃣ Forum Comments - Create & List

### Test 3.1: Get Comments (Empty)

```bash
curl "$BASE_URL/api/forum/posts/$POST_ID_1/comments"
```

**Expected Response (200)**:
```json
{
    "success": true,
    "data": [],
    "pagination": {
        "currentPage": 1,
        "totalPages": 0,
        "totalResults": 0
    }
}
```

---

### Test 3.2: Create Comment

```bash
curl -X POST "$BASE_URL/api/forum/posts/$POST_ID_1/comments" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_B_ID" \
  -d '{
    "content": "Mình đang học ngành này, rất thú vị và có nhiều cơ hội việc làm!"
  }'
```

**Expected Response (201)**:
```json
{
    "success": true,
    "message": "Tạo comment thành công",
    "data": {
        "_id": "<comment-id-1>",
        "postId": "<POST_ID_1>",
        "authorId": "<USER_B_ID>",
        "content": "Mình đang học ngành này...",
        "parentCommentId": null,
        "upvotes": 0,
        "createdAt": "2024-01-15T12:30:00Z"
    }
}
```

**Save**: `COMMENT_ID_1="<_id from response>"`

---

### Test 3.3: Verify commentCount Updated

```bash
curl "$BASE_URL/api/forum/posts/$POST_ID_1"
```

**Expected**: `"commentCount": 1`

---

### Test 3.4: Create Reply (Nested Comment)

```bash
curl -X POST "$BASE_URL/api/forum/posts/$POST_ID_1/comments" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_A_ID" \
  -d '{
    "content": "Cảm ơn bạn! Bạn có thể chia sẻ thêm về career path không?",
    "parentCommentId": "$COMMENT_ID_1"
  }'
```

**Expected Response (201)**: Returns comment with `parentCommentId` set

**Save**: `COMMENT_ID_2="<_id from response>"`

---

### Test 3.5: Get Comments (with replies)

```bash
curl "$BASE_URL/api/forum/posts/$POST_ID_1/comments"
```

**Expected**: Returns 2 comments, COMMENT_ID_2 has parentCommentId set

---

### Test 3.6: Create Comment Without Auth (Should Fail)

```bash
curl -X POST "$BASE_URL/api/forum/posts/$POST_ID_1/comments" \
  -H "Content-Type: application/json" \
  -d '{"content": "No auth comment"}'
```

**Expected Response (401)**:
```json
{
    "success": false,
    "message": "Không xác thực được người dùng"
}
```

---

## 4️⃣ Forum Comments - Update & Delete

### Test 4.1: Update Own Comment

```bash
curl -X PATCH "$BASE_URL/api/forum/comments/$COMMENT_ID_1" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_B_ID" \
  -d '{
    "content": "Cập nhật: Mình đang học, ngành này rất hứa hẹn!"
  }'
```

**Expected Response (200)**:
```json
{
    "success": true,
    "message": "Cập nhật comment thành công",
    "data": {
        "_id": "<comment-id-1>",
        "content": "Cập nhật: Mình đang học...",
        "updatedAt": "2024-01-15T13:00:00Z"
    }
}
```

---

### Test 4.2: Update Other User's Comment (Should Fail)

```bash
curl -X PATCH "$BASE_URL/api/forum/comments/$COMMENT_ID_1" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_A_ID" \
  -d '{"content": "Hacking"}'
```

**Expected Response (403)**:
```json
{
    "success": false,
    "message": "Bạn không có quyền chỉnh sửa bình luận này"
}
```

---

### Test 4.3: Upvote Comment

```bash
curl -X PATCH "$BASE_URL/api/forum/comments/$COMMENT_ID_1/upvote" \
  -H "X-User-Id: $USER_A_ID"
```

**Expected Response (200)**:
```json
{
    "success": true,
    "message": "Cập nhật upvote thành công",
    "data": {
        "upvotes": 1
    }
}
```

---

### Test 4.4: Delete Parent Comment (Should Cascade)

```bash
# First create a structure:
# COMMENT_ROOT → COMMENT_REPLY

curl -X DELETE "$BASE_URL/api/forum/comments/$COMMENT_ID_1" \
  -H "X-User-Id: $USER_B_ID"
```

**Expected Response (200)**:
```json
{
    "success": true,
    "message": "Xóa comment thành công"
}
```

---

### Test 4.5: Verify Cascade Delete

```bash
curl "$BASE_URL/api/forum/posts/$POST_ID_1/comments"
```

**Expected**: Should show reduced comments (replies deleted with parent)

---

### Test 4.6: Verify commentCount Decreased

```bash
curl "$BASE_URL/api/forum/posts/$POST_ID_1"
```

**Expected**: `"commentCount"` should be reduced

---

## 5️⃣ Complex Scenarios

### Scenario 1: Full Discussion Thread

```bash
# 1. User A creates post
curl -X POST $BASE_URL/api/forum/posts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_A_ID" \
  -d '{
    "title": "Python learning path",
    "content": "What is the best way to learn Python?"
  }'
# Save POST_ID

# 2. User B comments
curl -X POST "$BASE_URL/api/forum/posts/$POST_ID/comments" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_B_ID" \
  -d '{"content": "Start with basics: variables, loops, functions"}'
# Save COMMENT_B

# 3. User A replies
curl -X POST "$BASE_URL/api/forum/posts/$POST_ID/comments" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_A_ID" \
  -d '{
    "content": "How long does that take?",
    "parentCommentId": "$COMMENT_B"
  }'

# 4. Users upvote the answer
curl -X PATCH "$BASE_URL/api/forum/comments/$COMMENT_B/upvote" \
  -H "X-User-Id: $USER_A_ID"

# 5. Mark post as resolved
curl -X PATCH "$BASE_URL/api/forum/posts/$POST_ID" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_A_ID" \
  -d '{"status": "resolved"}'

# 6. View complete thread
curl "$BASE_URL/api/forum/posts/$POST_ID"
```

**Verify**:
- Post has 2 comments
- Comment tree shows hierarchy
- Upvotes visible on answer
- Status changed to resolved

---

### Scenario 2: Search & Discovery

```bash
# 1. Create multiple posts
for i in 1 2 3; do
  curl -X POST $BASE_URL/api/forum/posts \
    -H "Content-Type: application/json" \
    -H "X-User-Id: $USER_A_ID" \
    -d "{
      \"title\": \"Python tutorial part $i\",
      \"content\": \"Learn Python the easy way $i\"
    }"
done

# 2. Search for "Python"
curl "$BASE_URL/api/forum/posts?search=python"

# 3. Search for "tutorial"
curl "$BASE_URL/api/forum/posts?search=tutorial"

# 4. Sort by newest
curl "$BASE_URL/api/forum/posts?sort=-createdAt"

# 5. Paginate
curl "$BASE_URL/api/forum/posts?limit=1&page=1"
curl "$BASE_URL/api/forum/posts?limit=1&page=2"
```

**Verify**:
- Search returns relevant posts
- Pagination works correctly
- Sort order is correct

---

## Testing Checklist

| # | Test | Expected | Status |
|---|------|----------|--------|
| 1.1 | Create post | 201, post data | [ ] |
| 1.2 | Create post (user 2) | 201 | [ ] |
| 1.3 | Create without auth | 401 | [ ] |
| 1.4 | Create missing title | 400 | [ ] |
| 1.5 | Get all posts | 200, list | [ ] |
| 1.6 | Search posts | 200, filtered | [ ] |
| 1.7 | Filter by status | 200, filtered | [ ] |
| 1.8 | Sort by upvotes | 200, sorted | [ ] |
| 1.9 | Pagination | 200, page data | [ ] |
| 2.1 | Get post detail | 200, detail | [ ] |
| 2.2 | Get invalid post | 404 | [ ] |
| 2.3 | Update own post | 200, updated | [ ] |
| 2.4 | Update other's post | 403 | [ ] |
| 2.5 | Upvote post | 200, count↑ | [ ] |
| 2.6 | Upvote toggle | 200, count↓ | [ ] |
| 2.7 | Delete own post | 200 | [ ] |
| 2.8 | Delete other's post | 403 | [ ] |
| 3.1 | Get comments (empty) | 200, empty | [ ] |
| 3.2 | Create comment | 201, comment | [ ] |
| 3.3 | Check commentCount | Count increased | [ ] |
| 3.4 | Create reply | 201, nested | [ ] |
| 3.5 | Get comments | 200, both | [ ] |
| 3.6 | Create without auth | 401 | [ ] |
| 4.1 | Update comment | 200, updated | [ ] |
| 4.2 | Update other's | 403 | [ ] |
| 4.3 | Upvote comment | 200, count↑ | [ ] |
| 4.4 | Delete comment | 200 | [ ] |
| 4.5 | Check cascade | Replies gone | [ ] |
| 4.6 | Check count | Decreased | [ ] |
| 5.1 | Full thread | All steps ✓ | [ ] |
| 5.2 | Search & discover | All steps ✓ | [ ] |

---

## Debugging Tips

### If Getting 401 Error
- Check User ID is valid (must exist in database)
- Check X-User-Id header is present
- Verify user status is "active" (not pending/banned)

### If Getting 403 Error
- Verify you're using the same user ID that created the post/comment
- Check String comparison in code (should be same ObjectId)

### If Getting 404 Error
- Verify post/comment ID exists (from previous create response)
- Check spelling of the ID

### If Getting 400 Error
- Verify required fields: title, content
- Check JSON syntax in request body
- Verify data types

### If Getting 500 Error
- Check MongoDB connection
- Check server logs for stack trace
- Verify models are properly defined

---

## Performance Testing

### Load Test: Create 100 Posts

```bash
#!/bin/bash
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/forum/posts \
    -H "Content-Type: application/json" \
    -H "X-User-Id: $USER_A_ID" \
    -d "{
      \"title\": \"Test post $i\",
      \"content\": \"This is test post number $i\"
    }" &
done
wait
```

**Check**: Server should handle without crashing

---

## Cleanup (After Testing)

```bash
# Delete all test posts you created
curl -X DELETE "http://localhost:3000/api/forum/posts/$POST_ID_1" \
  -H "X-User-Id: $USER_A_ID"

# Delete test users (if test user management endpoint exists)
# Otherwise, filter them out from real data
```

---

**Testing Status**: Ready to execute
**Last Updated**: [Current Date]
**Tested By**: [Your Name]
