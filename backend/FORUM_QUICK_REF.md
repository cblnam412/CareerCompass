# Forum API Quick Reference

## Endpoint Summary

### Forum Posts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/forum/posts` | ❌ | Danh sách posts (search, filter, phân trang) |
| GET | `/api/forum/posts/:postId` | ❌ | Chi tiết post + comments |
| POST | `/api/forum/posts` | ✅ | Tạo post mới |
| PATCH | `/api/forum/posts/:postId` | ✅ | Cập nhật post (author only) |
| DELETE | `/api/forum/posts/:postId` | ✅ | Xóa post (author only) |
| PATCH | `/api/forum/posts/:postId/upvote` | ✅ | Upvote post |

### Forum Comments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/forum/posts/:postId/comments` | ❌ | Danh sách comments |
| POST | `/api/forum/posts/:postId/comments` | ✅ | Tạo comment/reply |
| PATCH | `/api/forum/comments/:commentId` | ✅ | Cập nhật comment (author only) |
| DELETE | `/api/forum/comments/:commentId` | ✅ | Xóa comment (author only) |
| PATCH | `/api/forum/comments/:commentId/upvote` | ✅ | Upvote comment |

---

## Common Requests

### Get All Posts (with search & pagination)
```bash
curl "http://localhost:3000/api/forum/posts?search=python&status=active&sort=-createdAt&limit=10&page=1"
```

Response:
```json
{
    "success": true,
    "data": [...],
    "pagination": {
        "currentPage": 1,
        "totalPages": 3,
        "totalResults": 25
    }
}
```

### Get Post Detail
```bash
curl http://localhost:3000/api/forum/posts/507f1f77bcf86cd799439011
```

### Create Post
```bash
curl -X POST http://localhost:3000/api/forum/posts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 507f1f77bcf86cd799439012" \
  -d '{
    "title": "Tiêu đề bài viết",
    "content": "Nội dung bài viết",
    "itemUrl": "https://example.com",
    "relatedMajorIds": ["majorId1"],
    "relatedUniversityIds": ["uniId1"]
  }'
```

### Update Post (author only)
```bash
curl -X PATCH http://localhost:3000/api/forum/posts/507f1f77bcf86cd799439020 \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 507f1f77bcf86cd799439012" \
  -d '{"content": "Nội dung mới", "status": "resolved"}'
```

### Delete Post (author only)
```bash
curl -X DELETE http://localhost:3000/api/forum/posts/507f1f77bcf86cd799439020 \
  -H "X-User-Id: 507f1f77bcf86cd799439012"
```

### Upvote Post
```bash
curl -X PATCH http://localhost:3000/api/forum/posts/507f1f77bcf86cd799439020/upvote \
  -H "X-User-Id: 507f1f77bcf86cd799439012"
```

---

## Comments

### Get Comments
```bash
curl "http://localhost:3000/api/forum/posts/507f1f77bcf86cd799439011/comments?sort=-createdAt&limit=20&page=1"
```

### Create Comment (direct reply)
```bash
curl -X POST http://localhost:3000/api/forum/posts/507f1f77bcf86cd799439011/comments \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 507f1f77bcf86cd799439016" \
  -d '{"content": "Bình luận của tôi"}'
```

### Create Comment Reply (nested)
```bash
curl -X POST http://localhost:3000/api/forum/posts/507f1f77bcf86cd799439011/comments \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 507f1f77bcf86cd799439018" \
  -d '{
    "content": "Reply lại bình luận",
    "parentCommentId": "507f1f77bcf86cd799439015"
  }'
```

### Update Comment (author only)
```bash
curl -X PATCH http://localhost:3000/api/forum/comments/507f1f77bcf86cd799439019 \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 507f1f77bcf86cd799439016" \
  -d '{"content": "Nội dung cập nhật"}'
```

### Delete Comment (author only)
```bash
curl -X DELETE http://localhost:3000/api/forum/comments/507f1f77bcf86cd799439019 \
  -H "X-User-Id: 507f1f77bcf86cd799439016"
```

### Upvote Comment
```bash
curl -X PATCH http://localhost:3000/api/forum/comments/507f1f77bcf86cd799439019/upvote \
  -H "X-User-Id: 507f1f77bcf86cd799439016"
```

---

## Query Parameters

### Posts List
```
?search=keyword          # Tìm kiếm title/content
&status=active           # Filter: active, resolved, closed
&sort=-createdAt         # Sort: -createdAt, createdAt, -upvotes, upvotes
&limit=10                # Items per page (default: 10)
&page=1                  # Page number (default: 1)
```

### Comments List
```
?sort=-createdAt         # Sort: -createdAt, createdAt, -upvotes, upvotes
&limit=20                # Items per page (default: 20)
&page=1                  # Page number (default: 1)
```

---

## Authentication

### How to pass User ID:

**Option 1: Header**
```bash
-H "X-User-Id: 507f1f77bcf86cd799439012"
```

**Option 2: Body**
```json
{"userId": "507f1f77bcf86cd799439012", ...}
```

---

## Error Responses

### 400 - Missing Required Fields
```json
{"success": false, "message": "Yêu cầu thiếu 'title' hoặc 'content'"}
```

### 401 - Not Authenticated
```json
{"success": false, "message": "Không xác thực được người dùng"}
```

### 403 - Not Authorized
```json
{"success": false, "message": "Bạn không có quyền chỉnh sửa bài viết này"}
```

### 404 - Not Found
```json
{"success": false, "message": "Bài viết không tồn tại"}
```

### 500 - Server Error
```json
{"success": false, "message": "Lỗi server"}
```

---

## Features

✅ **Post Features:**
- Search by title/content
- Filter by status (active/resolved/closed)
- Sort by date/upvotes
- Author-only edit/delete
- Upvoting system
- Track comment count

✅ **Comment Features:**
- Nested replies (parentCommentId)
- Pagination
- Author-only edit/delete
- Upvoting system
- Auto-update comment count on post

✅ **Pagination:**
- Customizable limit (default varies)
- Page-based navigation
- Returns total pages/results

---

## Common Workflows

### Workflow 1: Post Question → Get Answers → Mark as Resolved
```bash
# 1. Create post
POST /api/forum/posts
→ Returns: postId = "p123"

# 2. Browse comments (auto-populate with GET)
GET /api/forum/posts/p123

# 3. Update status when resolved
PATCH /api/forum/posts/p123
{"status": "resolved"}
```

### Workflow 2: Discussion Thread
```bash
# 1. Create post
POST /api/forum/posts
→ Returns: postId = "p123"

# 2. First comment
POST /api/forum/posts/p123/comments
→ Returns: commentId = "c1"

# 3. Reply to comment
POST /api/forum/posts/p123/comments
{"parentCommentId": "c1"}
→ Returns: commentId = "c2" (nested under c1)

# 4. Get all (auto-populated with GET detail)
GET /api/forum/posts/p123
→ Shows c1 and c2 with hierarchy
```

---

## Data Models

### ForumPost
```javascript
{
    _id: ObjectId,
    authorId: ObjectId,
    title: String,
    content: String,
    itemUrl: String,
    relatedMajorIds: [ObjectId],
    relatedUniversityIds: [ObjectId],
    commentCount: Number,
    status: 'active' | 'resolved' | 'closed',
    upvotes: Number,
    createdAt: Date,
    updatedAt: Date
}
```

### ForumComment
```javascript
{
    _id: ObjectId,
    postId: ObjectId,
    authorId: ObjectId,
    content: String,
    itemUrl: String,
    parentCommentId: ObjectId, // null nếu comment root
    upvotes: Number,
    createdAt: Date,
    updatedAt: Date
}
```

---

## Tips

1. Use `search` parameter để tìm post liên quan trước khi post câu hỏi
2. Mark post as `resolved` khi đã có câu trả lời
3. Use `parentCommentId` để tạo thread discussions
4. Upvote useful posts/comments để xây dựng cộng đồng
5. Sắp xếp comments theo `-upvotes` để xem answer hữu ích nhất trước
