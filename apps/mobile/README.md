# 📱 Hạt Gạo Sky Mobile Application (VietSky)

Ứng dụng di động hàng không đa nền tảng (iOS & Android) được xây dựng bằng **React Native (Expo + TypeScript)**, đồng bộ trực tiếp với hệ sinh thái backend NestJS và cơ sở dữ liệu của VietSky Airlines.

---

## 🌟 Tính Năng Nổi Bật (Full Features)

1. **✈️ Đặt vé & Tìm kiếm Chuyến bay:**
   - Tìm kiếm khứ hồi hoặc một chiều giữa các cảng hàng không lớn (SGN, HAN, DAD, PQC, CXR,...).
   - Bộ lọc khung giờ cất cánh tức thời: **Sáng (00:00 - 11:59)**, **Chiều (12:00 - 17:59)**, **Tối (18:00 - 23:59)**.
   - Sắp xếp giá vé tăng/giảm theo thời gian thực.
2. **💺 Sơ đồ Chỗ ngồi Trực quan (Fuselage Seat Map):**
   - Khoang Thương gia (Business Rows 1-3) & Khoang Phổ thông (Economy Rows 10-22).
   - Tự động đồng bộ giá vé động khi chuyển đổi giữa hạng ghế.
   - Cơ chế khóa giữ chỗ (Real-time seat hold) với bộ đếm thời gian an toàn.
3. **💳 Thanh toán & Đặt chỗ (Booking Wizard):**
   - Nhập thông tin hành khách, hành lý ký gửi, bữa ăn đặc biệt.
   - Thanh toán đa kênh (Thẻ quốc tế, Chuyển khoản VietQR, Điểm Lotus Miles).
4. **🎫 Quản lý Đặt chỗ & Thẻ lên máy bay (Boarding Pass):**
   - Tra cứu PNR (vd: `VSK89A`) xem thông tin chi tiết chuyến bay.
   - Hiển thị Thẻ lên máy bay điện tử (E-Boarding Pass) kèm mã QR và Barcode sắc nét.
   - Hỗ trợ gửi vé điện tử về email và yêu cầu hoàn hủy vé trực tiếp.
5. **🌟 Chương trình Hội viên Lotus Club:**
   - Thẻ hội viên số (Silver, Gold, Platinum, Diamond) với hiệu ứng kim loại sang trọng.
   - Tra cứu tích lũy dặm thưởng, đổi quà tặng vé máy bay & phòng chờ thương gia.
6. **👔 Cổng Điều Hành Bay (Staff / Operations Portal):**
   - Theo dõi doanh thu hàng tháng, chỉ số lấp đầy ghế (Load Factor), tỷ lệ đúng giờ (OTP).
   - Phê duyệt / từ chối các yêu cầu hoàn vé & nâng hạng của hành khách.
   - Trình chuyển đổi quyền nhanh (Quick Role Switcher) phục vụ báo cáo / demo đồ án.

---

## 🚀 Hướng Dẫn Khởi Chạy

### 1. Khởi chạy từ thư mục gốc Monorepo:
```bash
# Chạy đồng thời Backend API, Next.js Web và Mobile
npm run dev:api    # Cổng 4000
npm run dev:web    # Cổng 3000
npm run dev:mobile # Khởi chạy Expo Bundler
```

Hoặc chỉ chạy riêng ứng dụng Mobile:
```bash
npm run dev:mobile
```

### 2. Xem trực tiếp trên Điện thoại thật:
1. Cài đặt ứng dụng **Expo Go** trên App Store (iOS) hoặc Google Play Store (Android).
2. Khi terminal hiển thị mã QR, mở camera (iOS) hoặc ứng dụng Expo Go (Android) để quét mã.
3. Ứng dụng sẽ tự động tải bundle và kết nối trực tiếp với backend.

---

## 🔑 Tài Khoản Thử Nghiệm (Demo Accounts)

Hệ thống tích hợp sẵn nút chuyển quyền 1-chạm (Quick Role Switcher) ở màn hình **Tài khoản** và **Điều hành**:

| Quyền | Email | Mật khẩu | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Khách hàng** | `customer@vietsky.vn` | `Customer@123456` | Đặt vé, chọn ghế, xem Lotus Club, boarding pass |
| **Nhân viên** | `staff@vietsky.vn` | `Staff@123456` | Xử lý yêu cầu hoàn vé, kiểm tra danh sách bay |
| **Quản lý** | `manager@vietsky.vn` | `Manager@123456` | Xem KPI doanh thu, điều hành chuyến bay |
| **Quản trị viên** | `admin@vietsky.vn` | `Admin@123456` | Toàn quyền kiểm soát hệ thống |

