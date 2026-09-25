# TinyKPI Web Application

Hệ thống quản lý hiệu suất doanh nghiệp (BSC / KPI) và quy trình điều hành chuẩn hóa, clone trực tiếp từ nền tảng **TopKPI** (`https://topkpi-linux.toppion.com.vn`).

Dự án được xây dựng theo chuẩn **Clean Architecture 5 tầng**:
`Presentation → Controller/API → Service → Repository → Database`.

---

## 1. Công nghệ Sử dụng

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, TanStack Query v5, React Hook Form, Zod.
- **Backend**: Node.js, Express, TypeScript, Zod, Bcryptjs, JsonWebToken.
- **Database**: SQLite (qua Prisma ORM, sẵn sàng kết nối PostgreSQL bằng biến môi trường).
- **Migration & Seed**: Prisma Migration, Real database seed CLI.

---

## 2. Cấu trúc Dự án

```text
topkpi-clone/
├── REQUIREMENTS.md           # Toàn bộ quy tắc và yêu cầu bắt buộc
├── PHASE1_DISCOVERY.md       # Kết quả audit thực tế từ website nguồn
├── ARCHITECTURE.md           # Tài liệu phân tầng kiến trúc chi tiết
├── DATABASE.md               # Mô hình dữ liệu và bảng quan hệ
├── API.md                    # Tài liệu REST API thống nhất
├── package.json              # Quản lý script và dependencies
├── tsconfig.json
├── .env.example
├── prisma/
│   ├── schema.prisma         # Schema Prisma
│   └── seed.ts               # Seed data chuẩn
├── server/                   # Backend 5-layer
│   ├── index.ts
│   ├── middleware/
│   └── modules/
└── client/                   # Frontend Presentation Layer
    ├── index.html
    └── src/
```

---

## 3. Hướng dẫn Cài đặt & Khởi chạy

### Bước 1: Cài đặt Dependencies
```bash
npm install
```

### Bước 2: Thiết lập Biến Môi trường
Sao chép `.env.example` thành `.env`:
```bash
cp .env.example .env
```
Cấu hình mẫu:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="topkpi_super_secret_jwt_key_2026"
CORS_ORIGIN="http://localhost:5173"
```

### Bước 3: Chạy Migration CSDL
```bash
npm run db:migrate
```

### Bước 4: Khởi tạo Dữ liệu Mẫu (Seed Data)
Khởi tạo tài khoản quản trị, danh mục bộ phận, chức vụ và chiến lược BSC mẫu vào database thật:
```bash
npm run db:seed
```

### Bước 5: Chạy Ứng dụng ở Chế độ Development
Khởi chạy đồng thời cả Backend API và Frontend Vite:
```bash
npm run dev
```
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000/api`

---

## 4. Tài khoản Đăng nhập Mẫu

- **Tài khoản Quản trị:** `Thuankhanh.hust@gmail.com`
- **Mật khẩu:** `12345!`
- **Quyền hạn:** `Admin` (Toàn quyền quản trị cơ cấu tổ chức, nhân sự, chiến lược và quy trình).
