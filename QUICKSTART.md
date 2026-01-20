# Quick Start Guide - SA-HST Tender Analysis

## 🚀 Khởi Động Nhanh

### Bước 1: Clone & Cài Đặt

```bash
cd /Users/tinhvo/Desktop/CUSTOMER/MrPhong/SA-HST

# Backend
cd backend
npm install

# Frontend (terminal mới)
cd ../frontend
npm install
```

### Bước 2: Setup Database

```bash
# Khởi động PostgreSQL & Redis với Docker
docker-compose up -d

# Kiểm tra
docker ps
# Bạn sẽ thấy: postgres, redis, minio (optional)
```

### Bước 3: Cấu Hình Environment

**Backend (.env):**
```bash
cd backend
cp .env.example .env
nano .env  # hoặc code .env
```

**⚠️ BẮT BUỘC - Thêm ít nhất 1 AI API key:**
```env
# Chọn 1 trong 3 providers:

# Option 1: OpenAI
OPENAI_API_KEY=sk-...
AI_PROVIDER=openai

# Option 2: Google Gemini
GOOGLE_API_KEY=...
AI_PROVIDER=gemini

# Option 3: Anthropic Claude
ANTHROPIC_API_KEY=...
AI_PROVIDER=anthropic

# Hoặc để auto (tự chọn provider có sẵn)
AI_PROVIDER=auto
```

**Frontend (.env):**
```bash
cd ../frontend
cp .env.example .env
# Không cần sửa gì, mặc định đã OK
```

### Bước 4: Setup Database Schema

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### Bước 5: Khởi Động Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Server: http://localhost:3000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ App: http://localhost:5173

---

## 📱 Sử Dụng Application

### 1. Truy cập ứng dụng
Mở browser: **http://localhost:5173**

### 2. Upload hồ sơ thầu
- Click "Upload Hồ Sơ Mới" trên Dashboard
- Kéo thả hoặc chọn file ảnh (JPG, PNG, TIFF)
- Nhập tiêu đề (optional)
- Click "Upload và Phân Tích"

### 3. Theo dõi tiến trình
- Hệ thống tự động:
  - OCR từng trang
  - Phân tích với AI
  - Cập nhật realtime progress

### 4. Xem kết quả
- Phân loại hồ sơ thầu
- Người xét duyệt
- Điểm khả thi & tỷ lệ thắng
- Rủi ro & lưu ý
- Hồ sơ tương tự

---

## 🔍 Kiểm Tra Hệ Thống

### Health Check
```bash
curl http://localhost:3000/health
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "uptime": 123.45
}
```

### API Test
```bash
curl http://localhost:3000/api
```

### Database Check
```bash
cd backend
npx prisma studio
```
Opens Prisma Studio: http://localhost:5555

---

## ⚠️ Troubleshooting

### Backend không start
```bash
# Kiểm tra database
docker ps

# Nếu không có postgres
docker-compose up -d postgres redis

# Reset database
npx prisma migrate reset
npx prisma migrate dev
```

### Frontend không kết nối API
- Kiểm tra frontend/.env có đúng API URL
- Verify backend đang chạy port 3000
- Check browser console for errors

### OCR quá chậm
```bash
# Tăng concurrent jobs trong backend/.env
CONCURRENT_OCR_JOBS=5  # default là 3
```

### AI Analysis thất bại
- Kiểm tra API key hợp lệ
- Verify account còn credit
- Thử đổi provider khác

---

## 📊 Testing Với Dữ Liệu Mẫu

Để test hệ thống, bạn có thể:

1. **Tạo ảnh mẫu** từ hồ sơ thầu thực
2. **Screenshot** các trang PDF thành ảnh
3. **Scan** hồ sơ giấy

**Khuyến nghị:**
- File size: < 5MB per image
- Resolution: tốt nhất 300 DPI
- Format: JPG/PNG (TIFF nếu scan chất lượng cao)

---

## 🎯 Next Steps

1. ✅ Test với hồ sơ thầu thực tế
2. ✅ Fine-tune AI prompts dựa trên kết quả
3. ✅ Tối ưu OCR accuracy
4. ⏳ Deploy lên production server

---

## 📞 Support

Nếu gặp vấn đề:
1. Check logs trong terminal
2. Xem browser console (F12)
3. Verify all services running (`docker ps`)
4. Check API keys valid

**Happy analyzing! 🚀**
