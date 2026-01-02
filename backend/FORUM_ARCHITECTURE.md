# Forum System Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client/Frontend                           │
│  (Browser, Mobile App, or API Consumer)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    HTTP Requests
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express Server                                │
│                    (server.js)                                   │
│  - CORS enabled                                                 │
│  - JSON body parsing                                            │
│  - Route registration                                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    Routes (Express Router)
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐      ┌──────────────┐    ┌──────────┐
   │ authRoutes   │ forumRoutes  │ softSkillRoutes
   └─────────┘      └──────────────┘    └──────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
    POST/Comments                        POST/Posts
    GET/Comments                         GET/Posts
    PATCH/DELETE                         PATCH/DELETE
    UPVOTE                               UPVOTE
        │                                     │
        ▼                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Controllers                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ forumCommentController.js                              │    │
│  │  - getForumComments()       - Authorization check      │    │
│  │  - createForumComment()     - Input validation         │    │
│  │  - updateForumComment()     - Error handling           │    │
│  │  - deleteForumComment()     - Data transformation      │    │
│  │  - upvoteForumComment()     - DB operations            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ forumPostController.js                                 │    │
│  │  - getAllForumPosts()       - Search (regex)           │    │
│  │  - getForumPostById()       - Filter (status)          │    │
│  │  - createForumPost()        - Sort & pagination        │    │
│  │  - updateForumPost()        - Cascade delete           │    │
│  │  - deleteForumPost()        - Comment counting         │    │
│  │  - upvoteForumPost()        - Upvote management        │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                   Data Queries
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   User Model     │ │ ForumPost Model  │ │ForumComment Model│
│  - _id           │ │  - _id           │ │  - _id           │
│  - fullName      │ │  - authorId ◄───┼─┼─ authorId        │
│  - email         │ │  - title         │ │  - postId        │
│  - role          │ │  - content       │ │  - content       │
│  - status        │ │  - itemUrl       │ │  - itemUrl       │
│  - ...           │ │  - commentCount  │ │  - parentCommentId
│                  │ │  - status        │ │  - upvotes       │
│                  │ │  - upvotes       │ │  - timestamps    │
│                  │ │  - timestamps    │ │                  │
│                  │ │                  │ │  References:     │
│                  │ │  References:     │ │  ◄─ postId       │
│                  │ │  ◄─ authorId     │ │  ◄─ parentCommentId
│                  │ │                  │ │  ◄─ authorId     │
└──────────────────┘ └──────────────────┘ └──────────────────┘
        ▲                  ▲                  ▲
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    MongoDB Database
                    (Mongoose ODM)
                           │
                    ┌───────┴───────┐
                    │               │
            Read/Write Operations  Transactions
```

---

## Request Flow - Create Forum Post

```
1. USER REQUEST
   POST /api/forum/posts
   Headers: { X-User-Id: "user123" }
   Body: { title: "...", content: "..." }
                │
                ▼
2. ROUTING
   forumRoutes.js matches POST /posts
   Calls: createForumPost(req, res)
                │
                ▼
3. CONTROLLER
   createForumPost() in forumPostController.js
   
   3a. Extract Data
       - title, content from req.body
       - userId from header/body
       - relatedMajorIds, relatedUniversityIds (optional)
                │
                ▼
   3b. Validation
       - Check title exists ✓
       - Check content exists ✓
       - Max length checks ✓
                │
                ▼
   3c. User Verification
       const user = await User.findById(userId)
       if (!user) → return 401
                │
                ▼
   3d. Database Operation
       const post = new ForumPost({
           authorId: userId,
           title,
           content,
           itemUrl,
           relatedMajorIds,
           relatedUniversityIds,
           commentCount: 0,
           status: 'active',
           upvotes: 0
       })
       await post.save()
                │
                ▼
   3e. Success Response
       return {
           success: true,
           message: "Post created",
           data: post
       }
                │
                ▼
4. CLIENT RESPONSE
   Status: 201 Created
   Body: { success: true, data: {...} }
```

---

## Request Flow - Get Posts with Search

```
1. USER REQUEST
   GET /api/forum/posts?search=python&status=active&sort=-createdAt
                │
                ▼
2. ROUTING
   Calls: getAllForumPosts(req, res)
                │
                ▼
3. CONTROLLER
   getAllForumPosts()
   
   3a. Extract Query Params
       - search = "python"
       - status = "active"
       - sort = "-createdAt"
       - limit = 10 (default)
       - page = 1 (default)
                │
                ▼
   3b. Build Query Object
       Query filter = {}
       
       if (search) {
           filter = {
               $or: [
                   { title: { $regex: search, $options: 'i' } },
                   { content: { $regex: search, $options: 'i' } }
               ]
           }
       }
                │
                ▼
   3c. Add Status Filter
       if (status) {
           filter.status = status
       }
                │
                ▼
   3d. Build Sort Object
       sortObj = {}
       if (sort) {
           const sortDir = sort.startsWith('-') ? -1 : 1
           const field = sort.replace('-', '')
           sortObj[field] = sortDir
       }
                │
                ▼
   3e. Pagination Setup
       const limit = Math.min(Number(limit) || 10, 50)
       const page = Math.max(Number(page) || 1, 1)
       const skip = (page - 1) * limit
                │
                ▼
   3f. Execute Query
       const posts = await ForumPost.find(filter)
           .sort(sortObj)
           .skip(skip)
           .limit(limit)
           .populate('authorId', 'fullName email')
       
       const totalResults = await ForumPost.countDocuments(filter)
       const totalPages = Math.ceil(totalResults / limit)
                │
                ▼
   3g. Success Response
       return {
           success: true,
           data: posts,
           pagination: {
               currentPage: page,
               totalPages,
               totalResults
           }
       }
                │
                ▼
4. CLIENT RESPONSE
   Status: 200 OK
   Body: {
       success: true,
       data: [
           { _id, authorId, title, content, commentCount, ... },
           ...
       ],
       pagination: { currentPage: 1, totalPages: 3, totalResults: 25 }
   }
```

---

## Request Flow - Comment on Post (with Authorization)

```
1. USER REQUEST
   PATCH /api/forum/posts/p123
   Headers: { X-User-Id: "author123" }
   Body: { content: "Updated content" }
                │
                ▼
2. ROUTING
   Calls: updateForumPost(req, res, next)
                │
                ▼
3. CONTROLLER
   updateForumPost()
   
   3a. Extract Data
       - postId from req.params
       - userId from header/body
       - update data from req.body
                │
                ▼
   3b. User Verification
       const user = await User.findById(userId)
       if (!user) → return 401 "Not authenticated"
                │
                ▼
   3c. Post Verification
       const post = await ForumPost.findById(postId)
       if (!post) → return 404 "Post not found"
                │
                ▼
   3d. Authorization Check
       if (String(post.authorId) !== String(userId))
           → return 403 "Not authorized to edit"
       
       ✓ AUTHOR MATCH - Proceed
                │
                ▼
   3e. Update Post
       Object.keys(updateData).forEach(key => {
           if (allowedFields.includes(key)) {
               post[key] = updateData[key]
           }
       })
       
       post.updatedAt = new Date()
       await post.save()
                │
                ▼
   3f. Success Response
       return {
           success: true,
           message: "Post updated",
           data: post
       }
                │
                ▼
4. CLIENT RESPONSE
   Status: 200 OK
   Body: { success: true, message: "Updated", data: {...} }
```

---

## Authorization Flow

```
┌─ Request with X-User-Id ─┐
│                          │
▼                          ▼
User ID from       User ID from
Header            Body
  │                │
  └────────┬───────┘
           │
           ▼
   Extract userId
           │
           ▼
   ┌──────────────────────────────────┐
   │ Look up User in Database         │
   │ User.findById(userId)            │
   └──────────────────────────────────┘
           │
      ┌────┴────┐
      │          │
   Found      Not Found
      │          │
      ▼          ▼
   ✓ OK    ✗ 401 "Not authenticated"
      │
      ▼
   For POST/PATCH/DELETE:
   ┌──────────────────────────────────┐
   │ Check if User is Author          │
   │ post.authorId == userId?         │
   └──────────────────────────────────┘
      │
   ┌──┴──┐
   │     │
  YES   NO
   │     │
   ▼     ▼
   ✓ OK  ✗ 403 "Not authorized"
   │
   ▼
   Proceed with Operation
```

---

## Database Relationships

```
User Collection
  │
  ├─ One User → Many ForumPosts (via authorId)
  │  └─ (Cascade delete: delete posts when user deleted)
  │
  └─ One User → Many ForumComments (via authorId)
     └─ (Cascade delete: delete comments when user deleted)

ForumPost Collection
  │
  ├─ One Post → Many ForumComments (via postId)
  │  └─ (Cascade delete: delete comments when post deleted)
  │
  ├─ One Post → One User (authorId reference)
  │
  └─ One Post ↔ Many Majors (relatedMajorIds array)

ForumComment Collection
  │
  ├─ One Comment → One Post (postId reference)
  │
  ├─ One Comment → One User (authorId reference)
  │
  └─ One Comment → One Parent Comment (parentCommentId)
     └─ (Creates nested reply structure)
     └─ (Cascade delete: delete replies when parent deleted)
```

---

## State Transitions

### ForumPost Status
```
                    ┌──────────────┐
                    │    active    │
                    │  (default)   │
                    └──────┬───────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
           ┌─────────────┐     ┌─────────────┐
           │  resolved   │     │   closed    │
           │ (answered)  │     │  (locked)   │
           └─────────────┘     └─────────────┘
                │                     │
                └──────────┬──────────┘
                           │
                           ▼
                    (Can revert to active)
```

### Comment Status
- Active (default)
- Preserved on post status change
- Deleted when post/parent deleted

---

## Cascade Operations

### When ForumPost is Deleted

```
DELETE /api/forum/posts/:postId

1. Verify user is author
2. Find all ForumComments where postId = :postId
3. For each comment:
   - Find all child comments (parentCommentId = commentId)
   - Delete all child comments
4. Delete all ForumComments for this post
5. Decrement post commentCount to 0
6. Delete the ForumPost
7. Return success
```

### When ForumComment is Deleted

```
DELETE /api/forum/comments/:commentId

1. Verify user is author
2. Find comment
3. Find all child comments (parentCommentId = :commentId)
4. Delete all child comments
5. Delete the comment
6. Find parent post
7. Decrement post.commentCount -= (1 + childCount)
8. Save post
9. Return success
```

---

## Upvote System

### How Upvotes Work

```
User Views Post/Comment
        │
        ▼
Click Upvote Button
        │
        ▼
PATCH /api/forum/posts/:postId/upvote
        │
        ▼
Controller Logic:
  if (post.upvotes includes userId) {
      // Already upvoted → Remove
      upvotes.pull(userId)
  } else {
      // Not upvoted → Add
      upvotes.push(userId)
  }
  post.save()
        │
        ▼
Return Updated Count
{ upvotes: 42 }
```

### Upvote Storage
- Not a traditional counter
- Array of user IDs who upvoted
- MongoDB: `upvotes: [ObjectId, ObjectId, ...]`
- Returned count: `upvotes.length`
- Benefits:
  - Prevents duplicate upvotes
  - Can show who upvoted
  - Easy to toggle

---

## Error Handling Flow

```
User Request
     │
     ▼
[Try Block]
     │
  ┌──┴──┐
  │     │
Error  Success
  │     │
  ▼     ▼
[Catch Block] Continue
  │
  ├─ Check Error Type
  │  │
  │  ├─ ValidationError → 400
  │  ├─ CastError → 400
  │  ├─ NotFound → 404
  │  └─ Other → 500
  │
  └─ Return Error Response
     {
         success: false,
         message: "Error description"
     }
```

---

## Performance Considerations

### Indexing Strategy
- `ForumPost.authorId` - indexed (find posts by author)
- `ForumComment.postId` - indexed (find comments for post)
- `ForumComment.authorId` - indexed (find comments by author)
- `ForumComment.parentCommentId` - indexed (find child comments)

### Query Optimization
- `.populate('authorId', 'fullName email')` - Select only needed fields
- Pagination - limit results to prevent memory issues
- Regex search - use `$options: 'i'` for case-insensitive

### N+1 Query Prevention
- Comments populated in post detail view
- Author info populated in list views
- Avoid nested population depth

---

## Security Measures

✅ **Authentication**
- User must be verified before POST/PATCH/DELETE
- User ID from header or body

✅ **Authorization**
- Author-only edit/delete with 403 check
- String comparison: `String(post.authorId) !== String(userId)`

✅ **Input Validation**
- Required fields checked
- Length validation possible
- Sanitization of user inputs

✅ **Data Protection**
- Passwords hashed (User model)
- No sensitive fields in response
- Proper error messages (no info leakage)

---

## API Versioning Ready

Current structure allows for future versioning:

```
/api/forum/v1/posts      (future)
/api/forum/v2/posts      (future)
```

Just duplicate routes and increment version in path.

---

## Scalability Notes

### Current Limitations
- Single MongoDB connection
- No caching layer (Redis)
- No queue system (Bull, RabbitMQ)
- Synchronous operations

### Future Scalability
- Add Redis caching for popular posts
- Implement message queues for notifications
- Database replication (replica sets)
- Read replicas for search queries
- Elasticsearch for full-text search
- CDN for media URLs
