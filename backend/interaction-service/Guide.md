# Interaction Service Guide

## Mô tả (Overview)
`interaction-service` (hay Social Service) chịu trách nhiệm toàn bộ về các tính năng tương tác giữa người dùng với nhau trong hệ thống, bao gồm Diễn đàn (Forum), Nhắn tin (Chat) và Báo cáo vi phạm (Report).

## Các Routes 


## Môi trường (Environment Variables)
Tạo file `.env`:
```env
PORT=3004
MONGO_URI=your_mongodb_connection_string
# CLIENT_URL để config CORS cho Socket
CLIENT_URL=http://localhost:5173
```
