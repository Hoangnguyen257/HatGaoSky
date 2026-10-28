# Hạt Gạo Sky — Official Airline Ticket Booking System
> **Official Direct-From-Airline Booking Platform** (Single Airline, Not an OTA)  
> *Hệ thống đặt vé máy bay trực tuyến chính thức của Hãng Hàng Không Hạt Gạo Sky*

---

## ✈️ Giới thiệu dự án (Project Overview)

**Hạt Gạo Sky** là hệ thống đặt vé trực tuyến chính hãng, cho phép hành khách đặt vé với giá gốc minh bạch (không phí ẩn), tra cứu, so sánh tối đa 3 chuyến bay của hãng, giữ chỗ ghế thời gian thực (15 phút TTL), thanh toán bảo mật đa kênh (Thẻ quốc tế, Ví điện tử, VietQR chuyển khoản), quản lý/đổi/hủy vé trực tuyến, mua dịch vụ bổ trợ (hành lý ký gửi, nâng hạng thương gia), và tham gia chương trình khách hàng thân thiết **Bông Sen Vàng (Lotus Club)** tích lũy dặm thưởng.

Hệ thống cung cấp giao diện quản trị chuyên biệt theo 5 phân quyền RBAC cho nhân viên khai thác bay, quản lý doanh thu, và ban quản trị hệ thống.

---

## 👥 5 Phân quyền người dùng & Tài khoản Demo (RBAC Credentials)

Hệ thống hỗ trợ thanh công cụ **"Quick Role Switcher"** trực tiếp trên Header để chuyển đổi nhanh giữa 5 phân quyền chỉ với 1 click, hoặc đăng nhập thủ công:

| Phân quyền (Role) | Email đăng nhập | Mật khẩu | Mã xác thực 2FA (MFA) | Chức năng chính |
| :--- | :--- | :--- | :--- | :--- |
| **Guest** (Khách vãng lai) | *(Không cần đăng nhập)* | *(N/A)* | *(N/A)* | Tìm kiếm, so sánh chuyến bay, đặt vé cá nhân/gia đình/trẻ em/thú cưng, giữ chỗ ghế 15 phút, thanh toán (đầy đủ / trả trước 30% / giữ chỗ trả sau), tra cứu & hủy/nâng hạng vé qua Mã PNR + Email. |
| **Customer** (Hội viên Lotus) | `customer@vietsky.vn` | `Customer@123456` | Không yêu cầu | Hưởng toàn bộ quyền Guest + Thẻ hội viên Platinum (42.500 dặm), quản lý vé đã đặt, đổi dặm lấy quà (giao dịch hoàn tác atomic rollback), mua dặm, nâng hạng thẻ, quyền GDPR ẩn danh dữ liệu. |
| **Customer** (Hội viên Bạc) | `member@vietsky.vn` | `Customer@123456` | Không yêu cầu | Thẻ hội viên Silver (3.200 dặm), tích lũy chuyến bay domestic/international. |
| **Staff** (Nhân viên điều hành) | `staff@vietsky.vn` | `Staff@123456` | `123456` (Mã OTP) | Quản lý lịch bay (CRUD, kiểm tra xung đột tàu bay, vô hiệu hóa/hoãn bay kèm gửi email thông báo hành khách), quản lý mã giảm giá, xử lý yêu cầu đặt vé (Booking Requests) & nhật ký log thay đổi. |
| **Staff Manager** (Quản lý) | `manager@vietsky.vn` | `Manager@123456` | `123456` (Mã OTP) | Dashboard thống kê doanh thu biểu đồ Recharts, quản lý hồ sơ nhân viên, tính toán doanh thu theo chặng bay & hạng vé, xuất báo cáo Excel (CSV) và PDF theo State Machine. |
| **Admin** (Quản trị viên) | `admin@vietsky.vn` | `Admin@123456` | `123456` (Mã OTP) | Quản trị tài khoản người dùng, quản trị tài khoản Admin (bảo vệ chống tự xóa hoặc xóa Admin cuối cùng), xem Nhật ký hệ thống (Audit Logs), cấu hình tham số hệ thống, hòm thư email đã gửi (`sent_emails`). |

*Ghi chú mã đặt chỗ mẫu (Sample PNR):* `VSK89A` (Chuyến bay SGN ➔ HAN của khách hàng `Nguyen Van An`, email `customer@vietsky.vn`).

---

## 🛠️ Công nghệ sử dụng (Technology Stack)

### Frontend (`apps/web`)
- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript.
- **Styling**: Tailwind CSS với bảng màu Hàng không VietSky Navy (`#0f2b5c`), Xanh biển Cyan (`#0284c7`), Vàng kim (`#f59e0b`). Hỗ trợ Light / Dark Mode hoàn chỉnh.
- **Đa ngôn ngữ (i18n)**: `next-intl` hỗ trợ 3 ngôn ngữ: Tiếng Việt (`vi` - mặc định), Tiếng Anh (`en`), Tiếng Trung (`zh`). 100% văn bản và thông báo lỗi được định nghĩa theo i18n key.
- **Biểu đồ**: `Recharts` cho Dashboard doanh thu và cơ cấu hạng ghế của Staff Manager.
- **State & Form**: React Hook Form, Zod validation, TanStack Query, Lucide React icons.

### Backend (`apps/api`)
- **Framework**: NestJS 10 + TypeScript, kiến trúc phân tầng chuẩn mực (*Controller ➔ Service ➔ Repository*).
- **REST API**: Toàn bộ endpoint nằm dưới tiền tố `/api`, tài liệu tương tác tự động Swagger OpenAPI tại `/api/docs`.
- **Database & ORM**: Prisma ORM. Mặc định sử dụng SQLite (`apps/api/dev.db`) giúp khởi chạy ngay lập tức mà không cần cài đặt database bên ngoài. Đồng thời cung cấp file `schema.postgresql.prisma` và `docker-compose.yml` cho môi trường PostgreSQL 16 production.
- **Bảo mật & Auth**: JWT (Access Token + Refresh Token), mã hóa mật khẩu `bcrypt`, Role Guard phân quyền RBAC 5 cấp, MFA OTP simulation (`123456`) cho tài khoản quản trị.
- **Kiến trúc Adapter (Mocks)**:
  - `PaymentGatewayAdapter`: Xử lý thanh toán thẻ, ví MoMo/ZaloPay, chuyển khoản VietQR, hoàn tiền tự động khi hủy vé.
  - `EmailAdapter`: Ghi log console và lưu vào bảng `SentEmail` trong cơ sở dữ liệu để Admin có thể kiểm tra.
  - `CacheAdapter`: Bộ nhớ đệm TTL ngắn hạn cho kết quả tìm kiếm chuyến bay.

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy (Getting Started)

### Cách 1: Khởi chạy trực tiếp (Zero-Config Local Run)
Yêu cầu: Node.js >= 18.x và npm. Cơ sở dữ liệu SQLite đã được tạo sẵn và seed dữ liệu đầy đủ.

```bash
# 1. Cài đặt dependencies (nếu chưa cài)
npm install

# 2. Khởi chạy đồng thời cả Backend (port 4000) và Frontend (port 3000)
npm run dev
```

- **Giao diện Website**: [http://localhost:3000](http://localhost:3000)
- **Tài liệu Swagger API**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **API Endpoint**: [http://localhost:4000/api](http://localhost:4000/api)

### Cách 2: Khởi chạy với Docker Compose (PostgreSQL + Redis + Mailpit)
```bash
# Khởi động các container phụ trợ
docker compose up -d

# Chạy seed dữ liệu vào database
npm run seed
```

### Chạy kiểm thử tự động (Unit Test Suite)
Bộ unit test kiểm tra các nghiệp vụ cốt lõi: kiểm tra độ tuổi hành khách, giữ chỗ ghế nguyên tử (atomic seat hold) với thời gian sống TTL 15 phút, ngưỡng thanh toán trả trước (>= 30%), và công thức hoàn tiền khi hủy vé:
```bash
npm run test:api
```
*(Kết quả: 9/9 test cases PASS)*

---

## 🔄 Máy trạng thái (State Machines)

Hệ thống được thiết kế với các Enum trạng thái rõ ràng và guard chuyển đổi trạng thái:

1. **Booking State Machine**:
   - `NEW` ➔ `PENDING_PAYMENT` ➔ `CONFIRMED` ➔ `COMPLETED`
   - `PENDING_PAYMENT` ➔ `PARTIALLY_PAID` (khi thanh toán trước tối thiểu 30%) ➔ `CONFIRMED`
   - `CONFIRMED` / `PARTIALLY_PAID` ➔ `CANCELLED` ➔ `REFUND_PROCESSING`
   - `PENDING_PAYMENT` ➔ `EXPIRED` (khi hết hạn giữ chỗ Pay Later mà chưa thanh toán)
2. **Seat State Machine**:
   - `AVAILABLE` ➔ `HELD` (TTL 15 phút) ➔ `BOOKED`
   - `HELD` ➔ `AVAILABLE` (tự động mở lại khi hết hạn TTL mà không thanh toán)
3. **Payment State Machine**:
   - `PENDING` ➔ `SUCCESS` | `FAILED` | `PARTIALLY_PAID`
   - `SUCCESS` ➔ `REFUNDED`
4. **Loyalty State Machine**:
   - `REGISTERED` ➔ `ACTIVE` (Hạng: Standard, Silver, Gold, Platinum) ➔ `UPGRADED` ➔ `DEACTIVATED`
5. **Additional Service State Machine**:
   - `SELECTING` ➔ `PAYMENT_PROCESSING` ➔ `CONFIRMED` | `CANCELED`
6. **Export Job State Machine**:
   - `IDLE` ➔ `SELECTING` ➔ `SUBMITTED` ➔ `PROCESSING` ➔ `GENERATING` ➔ `READY` | `ERROR` | `TIMEOUT`
7. **User Account State Machine**:
   - `INACTIVE` (chưa kích hoạt email) ➔ `ACTIVE` ⮂ `DISABLED` ➔ `DELETED` (Soft delete)

---

## 🎯 Quy tắc nghiệp vụ cốt lõi (Core Business Rules)

1. **Giữ chỗ ghế nguyên tử (Atomic Seat-Hold TTL)**:
   - Khi hành khách chọn ghế trong quy trình đặt vé, ghế được chuyển sang trạng thái `HELD` trong 15 phút cùng bộ đếm lùi thời gian thực trên màn hình.
   - Sử dụng transaction kiểm tra tính nhất quán để triệt tiêu hiện tượng đặt trùng ghế (Double-booking).
   - Ghế quá hạn 15 phút mà chưa thanh toán sẽ tự động giải phóng về trạng thái `AVAILABLE`.
2. **Quy tắc hành khách & Độ tuổi**:
   - Em bé (Infant): < 2 tuổi (giảm 90% giá vé, ngồi chung với người lớn). Mỗi người lớn chỉ được đi kèm tối đa 1 em bé.
   - Trẻ em (Child): 2 - 11 tuổi (giảm 25% giá vé). Bắt buộc phải có ít nhất 1 người lớn đi kèm trong cùng một mã đặt chỗ PNR.
   - Đặt vé cho thú cưng: Khai báo chủng loại, giống loài, cân nặng (tối đa 32kg theo quy định an toàn bay).
3. **Thanh toán linh hoạt**:
   - **Thanh toán đầy đủ (Full Payment)**: Xác nhận vé ngay, xuất số vé điện tử và cộng dặm thưởng.
   - **Trả trước (Prepayment)**: Đặt cọc tối thiểu 30% tổng tiền vé, chuyển vé sang trạng thái `PARTIALLY_PAID`.
   - **Giữ chỗ trả sau (Pay Later)**: Giữ vé tối đa 24h hoặc trước 6h trước giờ bay, sau thời gian này tự động hủy.
4. **Quản lý & Hủy vé**:
   - Tra cứu vé không cần tài khoản: nhập Mã đặt chỗ (PNR) và Email hoặc Số điện thoại.
   - Phí hủy vé được tính toán tự động dựa trên quy định hạng vé (Economy: khấu trừ phí 300.000 VND; Business: miễn phí hủy trước 24h).
   - Kích hoạt lệnh hoàn tiền tự động qua `PaymentGatewayAdapter` và gửi email xác nhận.
5. **Chương trình Bông Sen Vàng (Lotus Club)**:
   - Tự động cộng dặm bay tương ứng với hành trình khi hoàn tất thanh toán.
   - Tự động xét nâng hạng thẻ: Standard (< 5.000 dặm), Silver (5.000 - 15.000 dặm), Gold (15.000 - 30.000 dặm), Platinum (> 30.000 dặm).
   - Đổi quà bằng dặm: Thực hiện qua cơ chế Transaction rollback an toàn nếu thiếu dặm hoặc quà hết số lượng.
6. **Bảo vệ an toàn cho Ban Quản trị (Admin Safety Guard)**:
   - Hệ thống ngăn chặn việc Admin tự xóa tài khoản của chính mình.
   - Hệ thống ngăn chặn việc xóa tài khoản Admin cuối cùng còn hoạt động trong hệ thống.
7. **Quyền riêng tư dữ liệu (GDPR Compliance)**:
   - Cung cấp tính năng "Yêu cầu xóa dữ liệu cá nhân" (Right to be Forgotten). Tên, email, số điện thoại được ẩn danh hóa (`GDPR_DELETED_xxx`), trong khi dữ liệu giao dịch kế toán vẫn được bảo toàn nguyên vẹn.

---

## 📂 Cấu trúc thư mục (Folder Structure)

```
Final_SWD/
├── apps/
│   ├── api/                           # NestJS Backend Application
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # Schema SQLite (dev mặc định)
│   │   │   ├── schema.postgresql.prisma # Schema PostgreSQL (cho Docker)
│   │   │   └── seed.ts                # Dữ liệu mẫu (chuyến bay, sân bay, 5 roles)
│   │   └── src/
│   │       ├── common/                # Guards (JWT, RBAC), Adapters (Payment, Email, Cache)
│   │       ├── modules/
│   │       │   ├── auth/              # Đăng ký, đăng nhập, 2FA OTP, reset password
│   │       │   ├── flights/           # Tìm kiếm, lọc, so sánh 3 chuyến, CRUD lịch bay
│   │       │   ├── seats/             # Giữ ghế 15p TTL, giải phóng ghế tự động
│   │       │   ├── bookings/          # Đặt vé, tra cứu PNR, hủy vé, nâng hạng, hành lý
│   │       │   ├── payments/          # Thanh toán Full, trả trước 30%, Pay Later, webhook
│   │       │   ├── loyalty/           # Dặm thưởng, đổi quà rollback, mua dặm, thăng hạng
│   │       │   ├── discounts/         # Mã khuyến mãi, kiểm tra ràng buộc xóa
│   │       │   ├── reports/           # Dashboard KPIs, biểu đồ, xuất file Excel/PDF
│   │       │   └── admin/             # Quản lý Users, Admin, Audit Logs, Sent Emails
│   │       └── test/
│   │           └── booking-rules.spec.ts # Unit tests cho nghiệp vụ cốt lõi
│   │
│   └── web/                           # Next.js 14 Frontend Application
│       ├── messages/                  # Từ điển đa ngôn ngữ i18n
│       │   ├── vi.json                # Tiếng Việt (Mặc định)
│       │   ├── en.json                # English
│       │   └── zh.json                # 中文 (Chinese)
│       └── src/
│           ├── components/
│           │   ├── layout/            # Header, Footer, RoleGuard, Quick Role Switcher
│           │   └── public/            # SearchWidget, FlightCard, CompareModal, SeatMap
│           ├── context/               # AuthContext với quản lý trạng thái 5 Roles
│           ├── lib/                   # REST API Client kết nối NestJS
│           └── app/[locale]/          # Next.js App Router (Public, Customer, Staff, Manager, Admin)
│
├── docker-compose.yml                 # Docker Compose (PostgreSQL 16, Redis 7, Mailpit)
├── package.json                       # Root workspaces orchestrator
└── README.md                          # Tài liệu hướng dẫn sử dụng chi tiết
```

---

## 🏆 Đạt yêu cầu nghiệm thu (Acceptance Criteria Verified)

- [x] Chạy ứng dụng chỉ với 1 câu lệnh (`npm run dev`) với dữ liệu mẫu khởi tạo hoàn chỉnh.
- [x] Quy trình khách hàng hoàn chỉnh (Happy Path): Tìm kiếm ➔ So sánh ➔ Chọn hạng vé ➔ Nhập thông tin hành khách & xác thực tuổi ➔ Giữ chỗ ghế thời gian thực (15 phút TTL) ➔ Mua dịch vụ bổ trợ ➔ Thanh toán ➔ Nhận mã PNR & email xác nhận ➔ Tra cứu & Hủy vé nhận tiền hoàn.
- [x] Ghế không bao giờ bị bán trùng; ghế giữ quá hạn tự động hoàn trả kho vé.
- [x] 5 Phân quyền RBAC độc lập; truy cập trái phép trả về mã lỗi 403 Forbidden với giao diện cảnh báo rõ ràng.
- [x] 100% nhãn hiển thị và thông báo lỗi được bản địa hóa qua 3 ngôn ngữ (vi, en, zh).
- [x] Đã hoàn thành bộ Unit Test kiểm tra các logic nghiệp vụ trọng yếu.
