# Recommendation Service Guide

## Mô tả (Overview)
`recommendation-service` là dịch vụ chuyên biệt cung cấp các tính năng gợi ý ngành học, lộ trình học tập, và định hướng nghề nghiệp dựa trên các thuật toán AI/Machine Learning và các bộ dữ liệu khảo sát.

## Các Routes

## Môi trường (Environment Variables)
Tạo file `.env`:
```env
PORT=3006
MONGO_URI=your_mongodb_connection_string
# Đường dẫn lưu model JSON
MODEL_STORAGE_PATH=./models_ml
```
