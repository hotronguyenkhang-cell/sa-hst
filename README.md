# Tender Analysis System

Hệ thống phân tích hồ sơ thầu thông minh sử dụng công nghệ AI

## 🚀 Tính Năng

- **Upload và OCR**: Hỗ trợ upload hồ sơ thầu dạng ảnh (10-100 trang), tự động OCR
- **AI Analysis**: Phân tích thông minh với nhiều AI provider (OpenAI, Gemini, Claude)
- **Phân Loại Tự Động**: 
  - Đấu thầu Online rộng rãi
  - Online cạnh tranh
  - Online Mua khẩn (khẩn cấp)
- **Đánh Giá Khả Thi**: Tính toán điểm khả thi, tỷ lệ thắng, cơ hội
- **Phân Tích Rủi Ro**: Tự động nhận diện và đánh giá các rủi ro
- **Tìm Kiếm Tương Tự**: Tìm các hồ sơ thầu tương tự đã thực hiện
- **Realtime Updates**: WebSocket hỗ trợ cập nhật tiến trình realtime

## 📋 Yêu Cầu Hệ Thống

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6
- Docker & Docker Compose (khuyến nghị)

## 🛠️ Cài Đặt

### 1. Clone project
```bash
cd /Users/tinhvo/Desktop/CUSTOMER/MrPhong/SA-HST
```

### 2. Cài đặt Backend
```bash
cd backend
npm install
```

### 3. Cấu hình Environment
```bash
cp .env.example .env
# Chỉnh sửa .env với API keys của bạn
```

**⚠️ Quan trọng**: Bạn cần ít nhất 1 AI provider API key:
- OpenAI: `OPENAI_API_KEY=sk-...`
- Google Gemini: `GOOGLE_API_KEY=...`
- Anthropic Claude: `ANTHROPIC_API_KEY=...`

### 4. Khởi động Database (Docker)
```bash
docker-compose up -d
```

### 5. Chạy Database Migrations
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 6. Khởi động Backend Server
```bash
npm run dev
```

Server sẽ chạy tại: http://localhost:3000

### 7. Cài đặt Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173

## 📚 API Documentation

### Upload Hồ Sơ
```bash
POST /api/tender/upload
Content-Type: multipart/form-data

files: [File, File, ...] # Danh sách file ảnh
title: string (optional) # Tiêu đề hồ sơ
```

### Kiểm Tra Trạng Thái
```bash
GET /api/tender/:id/status
```

### Lấy Kết Quả Phân Tích
```bash
GET /api/tender/:id/analysis
```

### Danh Sách Hồ Sơ
```bash
GET /api/tender/list?page=1&limit=20&status=COMPLETED
```

### Tìm Hồ Sơ Tương Tự
```bash
GET /api/tender/:id/similar?limit=5
```

## 🔧 Cấu Hình AI Provider

Hệ thống hỗ trợ nhiều AI providers với fallback tự động:

```env
# Chọn provider mặc định
AI_PROVIDER=auto  # auto sẽ tự chọn provider có sẵn

# Hoặc chỉ định cụ thể
AI_PROVIDER=openai
# AI_PROVIDER=gemini
# AI_PROVIDER=anthropic
```

Nếu provider mặc định fail, hệ thống tự động fallback sang provider khác.

## 🎨 Frontend (Bento 2.0 UI)

Frontend được thiết kế với **Bento 2.0** design system:
- Modern gradient colors
- Glassmorphism effects
- Smooth animations
- Mobile-first responsive
- Dark mode support

## 📊 Database Schema

- `TenderDocument`: Thông tin hồ sơ thầu
- `DocumentPage`: Từng trang của hồ sơ
- `Analysis`: Kết quả phân tích AI
- `RiskAssessment`: Đánh giá rủi ro
- `SimilarDocument`: Hồ sơ tương tự

## 🔄 Background Processing

Hệ thống sử dụng Bull Queue với Redis để xử lý background:
1. Upload files
2. OCR từng trang (parallel processing)
3. AI analysis
4. Lưu kết quả vào database
5. Realtime updates qua WebSocket

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test

# API tests
npm run test:api

# Integration tests
npm run test:integration
```

## 📈 Performance

- Concurrent OCR jobs: Cấu hình qua `CONCURRENT_OCR_JOBS`
- Concurrent AI jobs: Cấu hình qua `CONCURRENT_AI_JOBS`
- Redis caching: TTL cấu hình qua `CACHE_TTL`
- Response time: < 200ms (cached), < 2 phút (50 trang processing)

## 🚀 Deployment

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
1. Build frontend: `cd frontend && npm run build`
2. Set NODE_ENV=production
3. Run backend: `cd backend && npm start`
4. Setup reverse proxy (nginx/caddy)

## 🤝 Support

Liên hệ: [Your Contact Info]

## 📝 License

MIT
