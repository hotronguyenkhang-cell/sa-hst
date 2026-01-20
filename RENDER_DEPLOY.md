# Hướng dẫn Deploy Backend lên Render.com (Miễn Phí)

Vì gói Firebase Spark không hỗ trợ chạy code Backend (Functions), chúng ta sẽ dùng **Render** làm server phụ trợ.

## Bước 1: Đẩy code lên GitHub
1.  Đăng nhập GitHub và tạo một Repository mới (ví dụ: `tender-system`).
2.  Chạy lệnh trong Terminal để đẩy code lên:
    ```bash
    git init
    git add .
    git commit -m "Initial commit for Render"
    git branch -M main
    git remote add origin <LINK_REPO_CUA_BAN>
    git push -u origin main
    ```

## Bước 2: Tạo Web Service trên Render
1.  Truy cập [render.com](https://render.com) và đăng nhập (bằng GitHub).
2.  Nhấn **New +** -> **Web Service**.
3.  Chọn Repo `tender-system` bạn vừa tạo.
4.  Cấu hình như sau:
    -   **Name:** `tender-backend`
    -   **Region:** Singapore (cho nhanh)
    -   **Branch:** `main`
    -   **Root Directory:** `backend` (QUAN TRỌNG)
    -   **Runtime:** Node
    -   **Build Command:** `npm install`
    -   **Start Command:** `node server.js`
    -   **Instance Type:** Free

## Bước 3: Cấu hình biến môi trường (Environment Variables)
Trong màn hình tạo (hoặc tab **Environment** sau khi tạo), thêm các biến sau (lấy từ file `backend/.env`):

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `GOOGLE_API_KEY` | *(Copy từ file .env)* |
| `FIREBASE_STORAGE_BUCKET` | `xd-hst.firebasestorage.app` |
| `STORAGE_PROVIDER` | `firebase` |
| `FIREBASE_CONFIG` | *(Xem chú thích dưới)* |

**(*) Cách lấy `FIREBASE_CONFIG`:**
Vì server Render cần quyền truy cập Firestore, bạn cần tạo Service Key:
1.  Vào Firebase Console > Project Settings > Service accounts.
2.  Bấm **Generate new private key**.
3.  Mở file JSON vừa tải về, copy TOÀN BỘ nội dung.
4.  Trên Render, tạo biến `FIREBASE_SERVICE_ACCOUNT` và paste nội dung đó vào.

*(Sau đó nhắn lại mình để mình chỉnh code Backend đọc biến này nhé)*

## Bước 4: Lấy URL Backend
Sau khi deploy xong, Render sẽ cấp cho bạn một URL (ví dụ: `https://tender-backend.onrender.com`).
Bạn cần copy URL này để dán vào Frontend (nếu chưa cấu hình).

## Bước 5: Cập nhật Frontend
Nếu Frontend đang gọi `localhost:3000`, bạn cần đổi sang URL của Render.
(Nhắn mình để mình trỏ lại biến API_URL cho Frontend nhé).
