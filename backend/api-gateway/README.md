# API Gateway 🚀

API Gateway là một cổng chuyển tiếp trung tâm quản lý và điều hướng tất cả các requests tới các backend services khác nhau.

## 📋 Tính năng

- ✅ **Dynamic Service Routing** - Tự động định tuyến requests tới các services tương ứng
- ✅ **Request/Response Proxying** - Chuyển tiếp requests và xử lý responses
- ✅ **Error Handling** - Xử lý lỗi tập trung
- ✅ **Request Logging** - Ghi log tất cả requests
- ✅ **Health Checks** - Kiểm tra trạng thái gateway
- ✅ **Custom Headers** - Thêm custom headers cho tất cả requests
- ✅ **Timeout Management** - Quản lý timeout cho mỗi service
- ✅ **CORS Support** - Hỗ trợ CORS cho frontend

## 🛠 Cài đặt

1. **Cài đặt dependencies**
   ```bash
   npm install
   ```

2. **Tạo .env file từ .env.example**
   ```bash
   cp .env.example .env
   ```

3. **Cấu hình backend services URLs trong .env**
   ```env
   PORT=3000
   AUTH_SERVICE_URL=http://localhost:5000
   ```

## 🚀 Khởi động

### Development Mode (với auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Gateway sẽ chạy trên `http://localhost:3000`

## 📍 API Endpoints

### Gateway Information

#### Get Gateway Info
```bash
GET /api/gateway/info
```

Response:
```json
{
  "success": true,
  "message": "API Gateway Information",
  "gateway": {
    "version": "1.0.0",
    "uptime": 123.456,
    "timestamp": "2026-05-13T10:30:00.000Z"
  },
  "services": [
    {
      "key": "auth",
      "name": "Auth Service",
      "prefix": "/auth",
      "url": "http://localhost:5000",
      "timeout": 30000,
      "status": "active"
    }
  ]
}
```

#### Get Available Services
```bash
GET /api/gateway/services
```

Response:
```json
{
  "success": true,
  "services": ["auth"],
  "count": 1,
  "timestamp": "2026-05-13T10:30:00.000Z"
}
```

#### Health Check
```bash
GET /health
```

Response:
```json
{
  "success": true,
  "message": "API Gateway đang hoạt động",
  "timestamp": "2026-05-13T10:30:00.000Z"
}
```

### Proxied Service Routes

Tất cả requests tới các services được xử lý qua gateway:

```bash
# Auth Service - được forward tới http://localhost:5000
GET    /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
GET    /api/auth/profile
```

## 📊 Cấu trúc Project

```
api-gateway/
├── server.js              # Entry point
├── package.json           # Dependencies
├── .env.example           # Environment variables template
├── README.md              # This file
└── src/
    ├── config/
    │   └── services.js    # Service registry configuration
    ├── middlewares/
    │   └── errorHandler.js # Error handling middleware
    ├── routes/
    │   └── gateway.js     # Main gateway routes
    └── utils/
        └── proxyHelper.js # Proxy utility functions
```

## 🔧 Cấu hình Services

Để thêm một service mới, chỉnh sửa `src/config/services.js`:

```javascript
const services = {
    auth: {
        name: 'Auth Service',
        url: process.env.AUTH_SERVICE_URL || 'http://localhost:5000',
        prefix: '/auth',
        timeout: 30000,
        retries: 1
    },
    // Thêm service mới
    university: {
        name: 'University Service',
        url: process.env.UNIVERSITY_SERVICE_URL || 'http://localhost:5001',
        prefix: '/university',
        timeout: 30000,
        retries: 1
    }
};
```

Sau đó, thêm proxy route trong `src/routes/gateway.js`:

```javascript
const universityService = getService('/university');
if (universityService) {
    router.use('/university', createProxyMiddleware(universityService));
}
```

## 🔍 Request Flow

```
Client Request
    ↓
API Gateway (port 3000)
    ↓
Request Middleware (logging, headers, etc.)
    ↓
Route Matching (find service)
    ↓
Service Proxy
    ↓
Backend Service (port 5000, 5001, etc.)
    ↓
Response Processing
    ↓
Return to Client
```

## 📝 Custom Headers

Gateway tự động thêm các headers sau cho mỗi request:

```
x-forwarded-by: api-gateway
x-original-url: /api/auth/login
x-original-method: POST
x-request-id: 1234567890-abc123
x-forwarded-proto: http
x-forwarded-host: localhost:3000
x-real-ip: 127.0.0.1
```

## 🐛 Logging

Gateway ghi log tất cả requests với format:

```
remote-addr - method url status content-length - response-time ms
127.0.0.1 - POST /api/auth/login 200 256 - 45 ms
127.0.0.1 - GET /api/auth/profile 401 256 - 23 ms
```

## ⚠️ Error Handling

Tất cả errors được xử lý tập trung và trả về consistent format:

```json
{
  "success": false,
  "message": "Lỗi chi tiết",
  "error": "Chi tiết error (chỉ ở development)",
  "timestamp": "2026-05-13T10:30:00.000Z"
}
```

## 🚦 Common Response Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable

## 🔗 Integration với Frontend

```javascript
// Frontend API calls
const API_BASE_URL = 'http://localhost:3000/api';

// Auth Service
fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', ... })

// Các services khác
fetch(`${API_BASE_URL}/university/list`, { method: 'GET', ... })
```

## 📦 Dependencies

- `express` - Web framework
- `express-http-proxy` - HTTP proxy middleware
- `cors` - CORS middleware
- `morgan` - HTTP request logger
- `dotenv` - Environment variables
- `nodemon` - Auto-reload (dev)

## 🔐 Security Considerations

1. **Validate all requests** - Implement request validation ở mỗi service
2. **Authentication** - Implement authentication middleware nếu cần
3. **Rate Limiting** - Thêm rate limiting để prevent abuse
4. **HTTPS** - Sử dụng HTTPS ở production
5. **API Keys** - Implement API key authentication nếu cần

## 🚀 Production Deployment

1. Cài đặt dependencies:
   ```bash
   npm install --production
   ```

2. Cấu hình environment variables

3. Khởi động với process manager (PM2):
   ```bash
   npm install -g pm2
   pm2 start server.js --name "api-gateway"
   pm2 save
   pm2 startup
   ```

4. Cấu hình reverse proxy (Nginx):
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

## 📞 Support

Liên hệ support nếu có vấn đề.

## 📄 License

ISC
