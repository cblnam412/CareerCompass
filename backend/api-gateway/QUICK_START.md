# API Gateway - Quick Start Guide 🚀

## 1. Cài đặt

### 1.1 Cài đặt Dependencies
```bash
cd api-gateway
npm install
```

### 1.2 Tạo .env file
```bash
cp .env.example .env
```

File `.env` đã được cấu hình với giá trị mặc định:
```env
PORT=3000
NODE_ENV=development
AUTH_SERVICE_URL=http://localhost:5000
```

## 2. Chạy Gateway

### 2.1 Development Mode (Auto-reload)
```bash
npm run dev
```

### 2.2 Production Mode
```bash
npm start
```

Gateway sẽ chạy trên **http://localhost:3000**

## 3. Kiểm tra Gateway

### 3.1 Health Check
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "success": true,
  "message": "API Gateway đang hoạt động",
  "timestamp": "2026-05-13T10:30:00.000Z"
}
```

### 3.2 Gateway Info
```bash
curl http://localhost:3000/api/gateway/info
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

## 4. Sử dụng Auth Service qua Gateway

```javascript
// Gọi qua API Gateway
fetch('http://localhost:3000/api/auth/login', { method: 'POST', ... })
```

## 5. Auth Service Endpoints

### 5.1 Login
```bash
POST http://localhost:3000/api/auth/login
```

Body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 5.2 Register
```bash
POST http://localhost:3000/api/auth/register
```

Body:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

### 5.3 Get Profile
```bash
GET http://localhost:3000/api/auth/profile
```

Headers:
```
Authorization: Bearer <token>
```

## 6. Thêm Service Mới

### 6.1 Cấu hình Service (src/config/services.js)
```javascript
const services = {
    // Auth Service
    auth: { ... },
    
    // University Service (NEW)
    university: {
        name: 'University Service',
        url: process.env.UNIVERSITY_SERVICE_URL || 'http://localhost:5001',
        prefix: '/university',
        timeout: 30000,
        retries: 1
    }
};
```

### 6.2 Thêm Proxy Route (src/routes/gateway.js)
```javascript
// University Service Routes
const universityService = getService('/university');
if (universityService) {
    router.use('/university', createProxyMiddleware(universityService));
}
```

### 6.3 Cập nhật .env
```env
UNIVERSITY_SERVICE_URL=http://localhost:5001
```

Sau đó, endpoints của university service sẽ có sẵn:
```bash
GET http://localhost:3000/api/university/list
GET http://localhost:3000/api/university/:id
POST http://localhost:3000/api/university/search
```

## 7. Sử dụng Advanced Features (Optional)

### 7.1 Enable Rate Limiting
Sửa `.env`:
```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

Hoặc sử dụng `server.advanced.js`:
```bash
node server.advanced.js
```

### 7.2 Enable Circuit Breaker
Sửa `.env`:
```env
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_RESET_TIMEOUT=60000
```

### 7.3 Check Service Health Status
```bash
curl http://localhost:3000/api/gateway/health-status
```

Response:
```json
{
  "success": true,
  "services": {
    "auth": {
      "healthy": true,
      "status": 200,
      "timestamp": "2026-05-13T10:30:00.000Z"
    }
  },
  "timestamp": "2026-05-13T10:30:00.000Z"
}
```

## 8. Debugging

### 8.1 Xem Request Logs
```
127.0.0.1 - POST /api/auth/login 200 256 - 45 ms
📤 Forwarding POST /api/auth/login to http://localhost:5000
```

### 8.2 Xem Custom Headers
Tất cả requests được thêm custom headers:
```
x-request-id: 1234567890-abc123
x-forwarded-by: api-gateway
x-original-url: /api/auth/login
x-real-ip: 127.0.0.1
```

## 9. Triển Khai Production

### 9.1 Sử dụng PM2
```bash
npm install -g pm2
pm2 start server.js --name "api-gateway"
pm2 save
pm2 startup
```

### 9.2 Cấu hình Nginx Reverse Proxy
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
        proxy_set_header X-Forwarded-Host $server_name;
    }
}
```

## 10. Troubleshooting

### Problem: Connection refused
```
Error: connect ECONNREFUSED 127.0.0.1:5000
```

**Solution:**
- Kiểm tra auth-service có đang chạy không
- Xác nhận AUTH_SERVICE_URL trong .env
- Xác nhận port trong auth-service

### Problem: Timeout
```
Error: Timeout khi kết nối tới service
```

**Solution:**
- Tăng timeout value trong .env
- Kiểm tra performance của backend service
- Kiểm tra network connection

### Problem: 503 Service Unavailable
```json
{
  "success": false,
  "message": "Service \"auth\" không khả dụng"
}
```

**Solution:**
- Kiểm tra backend service logs
- Khởi động lại backend service
- Kiểm tra firewall rules

## 11. Architecture Diagram

```
┌─────────────────┐
│  Frontend       │
│  (Port 5173)    │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────┐
│   API Gateway (Port 3000)    │
│                              │
│  ├─ Routing                  │
│  ├─ Logging                  │
│  ├─ Error Handling           │
│  ├─ Rate Limiting (optional) │
│  ├─ Circuit Breaker (opt)    │
│  └─ Health Checks            │
└────┬─────────────────────┬───┘
     │                     │
     ▼                     ▼
┌──────────────┐   ┌──────────────┐
│ Auth Service │   │ Other Service│
│ (Port 5000)  │   │ (Port 5001)  │
└──────────────┘   └──────────────┘
```

## 12. File Structure
```
api-gateway/
├── server.js                  # Main server
├── server.advanced.js         # With advanced features
├── package.json
├── .env
├── .env.example
├── README.md
└── src/
    ├── config/
    │   └── services.js        # Service registry
    ├── middlewares/
    │   └── errorHandler.js    # Error handling
    ├── routes/
    │   └── gateway.js         # Gateway routes
    └── utils/
        ├── proxyHelper.js     # Proxy utilities
        └── advancedUtils.js   # Advanced features
```

## 13. Tiếp Theo

✅ API Gateway đã sẵn sàng!

- [ ] Kiểm tra tất cả endpoints
- [ ] Cấu hình thêm services
- [ ] Enable advanced features nếu cần
- [ ] Triển khai lên production
- [ ] Setup monitoring & logging

Chúc bạn thành công! 🚀
