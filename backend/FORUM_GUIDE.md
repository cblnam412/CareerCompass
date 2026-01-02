# Forum API Documentation

**Base URL**: `http://localhost:3000/api/forum`

## Overview

Forum hệ thống cho phép sinh viên/học sinh thảo luận, đặt câu hỏi, và chia sẻ kinh nghiệm liên quan đến tuyển sinh, ngành học, và trường đại học.

### Features:
- ✅ Danh sách bài viết với tìm kiếm (search title + content)
- ✅ Bộ lọc theo trạng thái (active, resolved, closed)
- ✅ Sắp xếp theo ngày/lượt upvote
- ✅ Bình luận lồng nhau (nested comments) với parentCommentId
- ✅ Upvote bài viết và bình luận
- ✅ Quản lý bài viết của mình (edit, delete)
- ✅ Quản lý bình luận của mình (edit, delete)

---

## Forum Posts API

### 1. GET `/posts` - Lấy danh sách bài viết

**Description**: Lấy danh sách tất cả bài viết (công khai, không cần auth)

**Parameters**:
```
Query Parameters:
- search (string, optional): Tìm kiếm theo title hoặc content
- status (string, optional): Lọc theo trạng thái (active, resolved, closed)
- sort (string, optional): Sắp xếp (-createdAt = mới nhất, -upvotes = nhiều upvote nhất)
- limit (number, optional): Số lượng bài trên một trang (default: 10)
- page (number, optional): Trang thứ mấy (default: 1)
```

**Example Request**:
```bash
GET /api/forum/posts?search=python&status=active&sort=-createdAt&limit=10&page=1
```

**Success Response** (200):
```json
{
    "success": true,
    "data": [
        {
            "_id": "507f1f77bcf86cd799439011",
            "authorId": {
                "_id": "507f1f77bcf86cd799439012",
                "fullName": "Nguyễn Văn A"
            },
            "title": "Cách học Python hiệu quả",
            "content": "Mình có một số kinh nghiệm muốn chia sẻ...",
            "itemUrl": "https://example.com",
            "relatedMajorIds": ["507f1f77bcf86cd799439013"],
            "relatedUniversityIds": ["507f1f77bcf86cd799439014"],
            "commentCount": 5,
            "status": "active",
            "upvotes": 12,
            "createdAt": "2024-01-15T10:30:00Z",
            "updatedAt": "2024-01-15T10:30:00Z"
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 3,
        "totalResults": 25
    }
}
```

**Error Response** (500):
```json
{
    "success": false,
    "message": "Lỗi server"
}
```

---

### 2. GET `/posts/:postId` - Lấy chi tiết bài viết

**Description**: Lấy chi tiết bài viết + danh sách comments

**Parameters**:
```
Path Parameters:
- postId (string): ID của bài viết
```

**Example Request**:
```bash
GET /api/forum/posts/507f1f77bcf86cd799439011
```

**Success Response** (200):
```json
{
    "success": true,
    "data": {
        "_id": "507f1f77bcf86cd799439011",
        "authorId": {
            "_id": "507f1f77bcf86cd799439012",
            "fullName": "Nguyễn Văn A",
            "email": "user@example.com"
        },
        "title": "Cách học Python hiệu quả",
        "content": "Mình có một số kinh nghiệm muốn chia sẻ với các bạn...",
        "itemUrl": "https://example.com",
        "relatedMajorIds": ["507f1f77bcf86cd799439013"],
        "relatedUniversityIds": ["507f1f77bcf86cd799439014"],
        "commentCount": 2,
        "status": "active",
        "upvotes": 12,
        "comments": [
            {
                "_id": "507f1f77bcf86cd799439015",
                "postId": "507f1f77bcf86cd799439011",
                "authorId": {
                    "_id": "507f1f77bcf86cd799439016",
                    "fullName": "Trần Thị B"
                },
                "content": "Cảm ơn bạn đã chia sẻ!",
                "itemUrl": null,
                "parentCommentId": null,
                "upvotes": 3,
                "createdAt": "2024-01-15T11:00:00Z",
                "updatedAt": "2024-01-15T11:00:00Z"
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
    "message": "Bài viết không tồn tại"
}
```

---

### 3. POST `/posts` - Tạo bài viết mới

**Description**: Tạo bài viết mới (yêu cầu auth)

**Parameters**:
```
Header:
- X-User-Id (string): ID của người dùng
OR
Body:
- userId (string): ID của người dùng

Body:
- title (string, required): Tiêu đề bài viết
- content (string, required): Nội dung bài viết
- itemUrl (string, optional): URL liên quan (ảnh, video, tài liệu)
- relatedMajorIds (array, optional): Mảng ID ngành liên quan
- relatedUniversityIds (array, optional): Mảng ID trường liên quan
```

**Example Request**:
```bash
POST /api/forum/posts
Content-Type: application/json
X-User-Id: 507f1f77bcf86cd799439012

{
    "title": "Hỏi về ngành học",
    "content": "Mình muốn biết về ngành Khoa học Dữ liệu...",
    "itemUrl": "https://example.com/info",
    "relatedMajorIds": ["507f1f77bcf86cd799439013"],
    "relatedUniversityIds": ["507f1f77bcf86cd799439014"]
}
```

**Success Response** (201):
```json
{
    "success": true,
    "message": "Tạo bài viết thành công",
    "data": {
        "_id": "507f1f77bcf86cd799439020",
        "authorId": "507f1f77bcf86cd799439012",
        "title": "Hỏi về ngành học",
        "content": "Mình muốn biết về ngành Khoa học Dữ liệu...",
        "itemUrl": "https://example.com/info",
        "relatedMajorIds": ["507f1f77bcf86cd799439013"],
        "relatedUniversityIds": ["507f1f77bcf86cd799439014"],
        "commentCount": 0,
        "status": "active",
        "upvotes": 0,
        "createdAt": "2024-01-15T12:00:00Z",
        "updatedAt": "2024-01-15T12:00:00Z"
    }
}
```

**Error Response** (400):
```json
{
    "success": false,
    "message": "Yêu cầu thiếu 'title' hoặc 'content'"
}
```

**Error Response** (401):
```json
{
    "success": false,
    "message": "Không xác thực được người dùng"
}
```

---

### 4. PATCH `/posts/:postId` - Cập nhật bài viết

**Description**: Cập nhật bài viết của mình

**Parameters**:
```
Path Parameters:
- postId (string): ID của bài viết

Header:
- X-User-Id (string): ID của người dùng
OR
Body:
- userId (string): ID của người dùng

Body (có thể cập nhật một phần):
- title (string, optional)
- content (string, optional)
- itemUrl (string, optional)
- status (string, optional): active, resolved, closed
- relatedMajorIds (array, optional)
- relatedUniversityIds (array, optional)
```

**Example Request**:
```bash
PATCH /api/forum/posts/507f1f77bcf86cd799439020
Content-Type: application/json
X-User-Id: 507f1f77bcf86cd799439012

{
    "content": "Nội dung cập nhật mới",
    "status": "resolved"
}
```

**Success Response** (200):
```json
{
    "success": true,
    "message": "Cập nhật bài viết thành công",
    "data": {
        "_id": "507f1f77bcf86cd799439020",
        "authorId": "507f1f77bcf86cd799439012",
        "title": "Hỏi về ngành học",
        "content": "Nội dung cập nhật mới",
        "status": "resolved",
        "upvotes": 5,
        "commentCount": 2,
        "updatedAt": "2024-01-15T13:00:00Z"
    }
}
```

**Error Response** (403):
```json
{
    "success": false,
    "message": "Bạn không có quyền chỉnh sửa bài viết này"
}
```

---

### 5. DELETE `/posts/:postId` - Xóa bài viết

**Description**: Xóa bài viết (xóa tất cả comments kèm theo)

**Parameters**:
```
Path Parameters:
- postId (string): ID của bài viết

Header:
- X-User-Id (string): ID của người dùng
OR
Body:
- userId (string): ID của người dùng
```

**Example Request**:
```bash
DELETE /api/forum/posts/507f1f77bcf86cd799439020
X-User-Id: 507f1f77bcf86cd799439012
```

**Success Response** (200):
```json
{
    "success": true,
    "message": "Xóa bài viết thành công"
}
```

**Error Response** (403):
```json
{
    "success": false,
    "message": "Bạn không có quyền xóa bài viết này"
}
```

---

### 6. PATCH `/posts/:postId/upvote` - Upvote bài viết

**Description**: Upvote bài viết (toggle)

**Parameters**:
```
Path Parameters:
- postId (string): ID của bài viết

Header:
- X-User-Id (string): ID của người dùng
OR
Body:
- userId (string): ID của người dùng
```

**Example Request**:
```bash
PATCH /api/forum/posts/507f1f77bcf86cd799439020/upvote
X-User-Id: 507f1f77bcf86cd799439012
```

**Success Response** (200):
```json
{
    "success": true,
    "message": "Cập nhật upvote thành công",
    "data": {
        "upvotes": 6
    }
}
```

---

## Forum Comments API

### 7. GET `/posts/:postId/comments` - Lấy danh sách comments

**Description**: Lấy danh sách comments của một bài viết

**Parameters**:
```
Path Parameters:
- postId (string): ID của bài viết

Query Parameters:
- sort (string, optional): Sắp xếp (-createdAt = mới nhất, -upvotes = nhiều upvote)
- limit (number, optional): Số lượng comments trên một trang (default: 20)
- page (number, optional): Trang thứ mấy (default: 1)
```

**Example Request**:
```bash
GET /api/forum/posts/507f1f77bcf86cd799439011/comments?sort=-createdAt&limit=20&page=1
```

**Success Response** (200):
```json
{
    "success": true,
    "data": [
        {
            "_id": "507f1f77bcf86cd799439015",
            "postId": "507f1f77bcf86cd799439011",
            "authorId": {
                "_id": "507f1f77bcf86cd799439016",
                "fullName": "Trần Thị B"
            },
            "content": "Cảm ơn bạn đã chia sẻ!",
            "itemUrl": null,
            "parentCommentId": null,
            "upvotes": 3,
            "createdAt": "2024-01-15T11:00:00Z",
            "updatedAt": "2024-01-15T11:00:00Z"
        },
        {
            "_id": "507f1f77bcf86cd799439017",
            "postId": "507f1f77bcf86cd799439011",
            "authorId": {
                "_id": "507f1f77bcf86cd799439018",
                "fullName": "Lê Văn C"
            },
            "content": "Mình có thêm một ý kiến...",
            "itemUrl": null,
            "parentCommentId": "507f1f77bcf86cd799439015",
            "upvotes": 1,
            "createdAt": "2024-01-15T11:30:00Z",
            "updatedAt": "2024-01-15T11:30:00Z"
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "totalResults": 2
    }
}
```

---

### 8. POST `/posts/:postId/comments` - Tạo comment mới

**Description**: Tạo comment/reply trên bài viết

**Parameters**:
```
Path Parameters:
- postId (string): ID của bài viết

Header:
- X-User-Id (string): ID của người dùng
OR
Body:
- userId (string): ID của người dùng

Body:
- content (string, required): Nội dung comment
- itemUrl (string, optional): URL liên quan
- parentCommentId (string, optional): ID comment cha (nếu là reply)
```

**Example Request** (Comment trực tiếp):
```bash
POST /api/forum/posts/507f1f77bcf86cd799439011/comments
Content-Type: application/json
X-User-Id: 507f1f77bcf86cd799439016

{
    "content": "Cảm ơn bạn đã chia sẻ!"
}
```

**Example Request** (Reply):
```bash
POST /api/forum/posts/507f1f77bcf86cd799439011/comments
Content-Type: application/json
X-User-Id: 507f1f77bcf86cd799439018

{
    "content": "Mình có thêm một ý kiến...",
    "parentCommentId": "507f1f77bcf86cd799439015"
}
```

**Success Response** (201):
```json
{
    "success": true,
    "message": "Tạo comment thành công",
    "data": {
        "_id": "507f1f77bcf86cd799439019",
        "postId": "507f1f77bcf86cd799439011",
        "authorId": "507f1f77bcf86cd799439016",
        "content": "Cảm ơn bạn đã chia sẻ!",
        "itemUrl": null,
        "parentCommentId": null,
        "upvotes": 0,
        "createdAt": "2024-01-15T11:00:00Z",
        "updatedAt": "2024-01-15T11:00:00Z"
    }
}
```

**Error Response** (400):
```json
{
    "success": false,
    "message": "Yêu cầu thiếu 'content'"
}
```

---

### 9. PATCH `/comments/:commentId` - Cập nhật comment

**Description**: Cập nhật comment của mình

**Parameters**:
```
Path Parameters:
- commentId (string): ID của comment

Header:
- X-User-Id (string): ID của người dùng
OR
Body:
- userId (string): ID của người dùng

Body:
- content (string, optional)
- itemUrl (string, optional)
```

**Example Request**:
```bash
PATCH /api/forum/comments/507f1f77bcf86cd799439019
Content-Type: application/json
X-User-Id: 507f1f77bcf86cd799439016

{
    "content": "Nội dung comment đã cập nhật"
}
```

**Success Response** (200):
```json
{
    "success": true,
    "message": "Cập nhật comment thành công",
    "data": {
        "_id": "507f1f77bcf86cd799439019",
        "content": "Nội dung comment đã cập nhật",
        "updatedAt": "2024-01-15T12:00:00Z"
    }
}
```

---

### 10. DELETE `/comments/:commentId` - Xóa comment

**Description**: Xóa comment (xóa tất cả reply nếu có)

**Parameters**:
```
Path Parameters:
- commentId (string): ID của comment

Header:
- X-User-Id (string): ID của người dùng
OR
Body:
- userId (string): ID của người dùng
```

**Example Request**:
```bash
DELETE /api/forum/comments/507f1f77bcf86cd799439019
X-User-Id: 507f1f77bcf86cd799439016
```

**Success Response** (200):
```json
{
    "success": true,
    "message": "Xóa comment thành công"
}
```

---

### 11. PATCH `/comments/:commentId/upvote` - Upvote comment

**Description**: Upvote comment (toggle)

**Parameters**:
```
Path Parameters:
- commentId (string): ID của comment

Header:
- X-User-Id (string): ID của người dùng
OR
Body:
- userId (string): ID của người dùng
```

**Example Request**:
```bash
PATCH /api/forum/comments/507f1f77bcf86cd799439019/upvote
X-User-Id: 507f1f77bcf86cd799439016
```

**Success Response** (200):
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

## Error Codes

| Code | Message | Meaning |
|------|---------|---------|
| 400 | Missing required fields | Thiếu trường bắt buộc |
| 401 | User not authenticated | Không xác thực được người dùng |
| 403 | Not authorized to perform this action | Không có quyền thực hiện hành động |
| 404 | Post/Comment not found | Bài viết/Comment không tồn tại |
| 500 | Server error | Lỗi máy chủ |

---

## Database Schema Reference

### ForumPost Collection
```javascript
{
    _id: ObjectId,
    authorId: ObjectId (ref: User),
    title: String (required),
    content: String (required),
    itemUrl: String,
    relatedMajorIds: [ObjectId],
    relatedUniversityIds: [ObjectId],
    commentCount: Number (default: 0),
    status: String (enum: ['active', 'resolved', 'closed'], default: 'active'),
    upvotes: Number (default: 0),
    createdAt: Date,
    updatedAt: Date
}
```

### ForumComment Collection
```javascript
{
    _id: ObjectId,
    postId: ObjectId (ref: ForumPost, required),
    authorId: ObjectId (ref: User, required),
    content: String (required),
    itemUrl: String,
    parentCommentId: ObjectId (ref: ForumComment, optional),
    upvotes: Number (default: 0),
    createdAt: Date,
    updatedAt: Date
}
```

---

## Usage Examples

### Example 1: Tạo bài viết và reply
```bash
# 1. Tạo bài viết
curl -X POST http://localhost:3000/api/forum/posts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 507f1f77bcf86cd799439012" \
  -d '{
    "title": "Ngành Khoa học Dữ liệu như thế nào?",
    "content": "Mình sắp chọn ngành, muốn biết trước..."
  }'

# 2. Xem bài viết chi tiết
curl http://localhost:3000/api/forum/posts/507f1f77bcf86cd799439020

# 3. Comment trực tiếp
curl -X POST http://localhost:3000/api/forum/posts/507f1f77bcf86cd799439020/comments \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 507f1f77bcf86cd799439016" \
  -d '{"content": "Ngành rất thú vị, mình đang học năm 2"}'

# 4. Reply comment
curl -X POST http://localhost:3000/api/forum/posts/507f1f77bcf86cd799439020/comments \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 507f1f77bcf86cd799439018" \
  -d '{
    "content": "Bạn có thể chia sẻ thêm về career path không?",
    "parentCommentId": "507f1f77bcf86cd799439015"
  }'
```

### Example 2: Tìm kiếm và lọc
```bash
# Tìm bài viết về Python
curl "http://localhost:3000/api/forum/posts?search=python&sort=-createdAt&limit=10"

# Lấy bài viết đã được giải quyết
curl "http://localhost:3000/api/forum/posts?status=resolved"

# Lấy comments sắp xếp theo upvotes
curl "http://localhost:3000/api/forum/posts/507f1f77bcf86cd799439020/comments?sort=-upvotes"
```

---

## Best Practices

1. **Always include X-User-Id header** for authenticated requests
2. **Use parentCommentId** khi reply để tạo thread structure
3. **Search before posting** để tránh duplicate questions
4. **Update status to 'resolved'** khi câu hỏi đã được trả lời
5. **Be respectful** - Upvote useful comments/posts để xây dựng cộng đồng
