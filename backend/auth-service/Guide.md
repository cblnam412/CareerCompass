# Auth Service Guide

## Mô tả (Overview)
`auth-service` là dịch vụ cốt lõi chịu trách nhiệm về bảo mật, xác thực (Authentication) và phân quyền (Authorization) cho toàn bộ hệ thống. Bất kỳ request nào cần định danh người dùng đều phải thông qua logic hoặc token do service này cấp phát.

## Các Routes 

## Môi trường (Environment Variables)
Tạo file `.env`:
```env
PORT=3001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
```