# API Gateway Guide

## Mô tả (Overview)
`api-gateway` là cổng giao tiếp duy nhất (entry point) của hệ thống đối với Frontend (Web/Mobile) và các client bên ngoài. Service này đóng vai trò như một reverse proxy, tiếp nhận mọi request HTTP/WebSocket và điều hướng chúng đến các Microservice phù hợp.

## Các Routes chuyển tiếp


## Môi trường (Environment Variables)
Tạo file `.env` chứa các config cơ bản:
```env
PORT=3000
# URLs của các service con
AUTH_SERVICE_URL=http://localhost:3001
STUDENT_SERVICE_URL=http://localhost:3002
ACADEMIC_SERVICE_URL=http://localhost:3003
INTERACTION_SERVICE_URL=http://localhost:3004
QUIZ_SERVICE_URL=http://localhost:3005
RECOMMENDATION_SERVICE_URL=http://localhost:3006
```