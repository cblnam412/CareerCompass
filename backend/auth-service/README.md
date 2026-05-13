# Auth Service

Dịch vụ xác thực cho hệ thống quản lý đại học (Microservice Architecture - Database per Service).

## Cấu trúc thư mục

```
auth-service/
├── src/
│   ├── controllers/      # Xử lý yêu cầu HTTP
│   ├── middlewares/      # Middleware xác thực & phân quyền
│   ├── models/          # MongoDB schemas (tối giản)
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Tiện ích (database, Supabase)
├── server.js            # Entry point
├── package.json
├── .env                 # Biến môi trường
└── CODE.js             # Code mẫu
```

## Design Philosophy - Microservice

**Database per Service**: Auth Service chỉ lưu trữ:
- User authentication data (email, password, role)
- User profile basic (fullName, DOB, address, avatar, studentId)
- Avatar URL (từ Supabase storage)
- University reference (chỉ ID cho uniRep/uniManager)

**Removed Models** (do tính đơn lẻ của service):
- ~~StudentProfile~~ → Lưu ở Student Service
- ~~UniversityAffiliation~~ → Lưu ở University Service

## API Endpoints

### Public Routes

#### 1. Login
```
POST /api/auth/login
```
Request: `{ email, password }`
Response: `{ token, user }`

#### 2. Register User
```
POST /api/auth/register
```
Request: `{ fullName, email, password, DOB, address, studentId }`

#### 3. Register University Rep
```
POST /api/auth/register-uni-rep
```
Multipart: Files (studentCardFront, studentCardBack) + User data

#### 4. Get User Profile (Public)
```
GET /api/auth/profile/:userId
```
Response: User profile (fullName, DOB, avatar, address, role, etc.)

### Protected Routes (require JWT token)

#### 5. Get My Profile
```
GET /api/auth/me
Header: Authorization: Bearer <token>
```

#### 6. Update My Profile
```
PUT /api/auth/profile
Header: Authorization: Bearer <token>
Body: { fullName, DOB, address, studentId, password }
```

#### 7. Upload Avatar
```
POST /api/auth/avatar
Header: Authorization: Bearer <token>
Multipart: avatar (file)
```
Storage: Supabase bucket `user-avatars`

#### 8. Delete Avatar
```
DELETE /api/auth/avatar
Header: Authorization: Bearer <token>
```

#### 9. Verify Token
```
GET /api/auth/verify
Header: Authorization: Bearer <token>
```
Response: `{ userId, email, role }`

## Database Schema (Minimal)

### User Collection
```javascript
{
  email: String (unique, required),
  password: String (hashed),
  fullName: String,
  phone: String,
  DOB: Date,
  address: String,
  avatar: String (Supabase URL),
  studentId: String (unique, sparse),
  role: 'admin' | 'uniManager' | 'uniRep' | 'user',
  status: 'active' | 'pending' | 'banned',
  universityId: ObjectId (required for uniRep, uniManager),
  createdAt: Date,
  updatedAt: Date
}
```

**Total fields: 14** (so sánh với các service khác, rất tối giản)

## Cài đặt

1. Dependencies:
```bash
npm install
```

2. Cấu hình `.env`:
```
MONGO_URL=mongodb://localhost:27017/auth-service
PORT=3001
JWT_SECRET=your_secret_key
NODE_ENV=development
SUPABASE_URL=https://[project].supabase.co
SUPABASE_KEY=[anon-key]
```

3. Run server:
```bash
npm start          # Production
npm run dev        # Development
```

## Tính năng

✅ Xác thực người dùng (login/register)
✅ Profile management (get/update)
✅ Avatar upload/delete (Supabase storage)
✅ JWT token authentication
✅ Role-based access control (RBAC)
✅ Password hashing (bcrypt)
✅ Status management (active/pending/banned)
✅ Microservice-ready (minimal database)

## Roles

- `admin` - Quản trị viên hệ thống
- `uniManager` - Quản lý đại học
- `uniRep` - Đại diện trường
- `user` - Người dùng thông thường (sinh viên)

## Status

- `active` - Hoạt động bình thường
- `pending` - Chờ phê duyệt (uniRep/uniManager)
- `banned` - Bị khóa/cấm

## External Dependencies

- **MongoDB**: User data storage
- **Supabase**: File storage (avatar, student cards)
- **JWT**: Token-based authentication
- **bcrypt**: Password hashing

## Security Notes

- Mật khẩu luôn được hash trước khi lưu
- Token JWT hết hạn sau 7 ngày
- Password field không được select mặc định
- Email unique và lowercase
- Role/status validation enums

## Error Handling

Tất cả errors trả về format:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

HTTP Status codes:
- 200: Success
- 201: Created
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Server error

## Testing

Xem [API_GUIDE.md](API_GUIDE.md) để có đầy đủ ví dụ cURL testing.


