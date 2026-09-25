# KIẾN TRÚC HỆ THỐNG — ARCHITECTURE DESIGN

## 1. Nguyên tắc cốt lõi: 5-Layer Clean Architecture

Hệ thống được thiết kế theo đúng mô hình phân tầng chặt chẽ:
```text
UI / Page (Presentation Layer)
       ↓
Controller / API Layer (HTTP, Routing, Validation, Auth Guard)
       ↓
Service Layer (Business Logic, Rules, Transactions)
       ↓
Repository Layer (Data Access & Database Queries)
       ↓
Database Layer (Prisma ORM, SQLite/PostgreSQL, Foreign Keys, Indexes)
```

Frontend và Backend phân định rõ trách nhiệm, KHÔNG bypass tầng, KHÔNG gọi database trực tiếp từ controller hay component.

---

## 2. Trách nhiệm của từng Layer

### 2.1. Presentation Layer (`client/src/`)
- **Nhiệm vụ:** Rendering giao diện, tương tác người dùng, quản lý local UI state (modals, active tabs), quản lý server cache state qua **TanStack Query**.
- **Form & Validation:** React Hook Form kết hợp Zod schema.
- **Tuyệt đối không chứa:** Business logic tính toán quyền, trực tiếp kết nối cơ sở dữ liệu.

### 2.2. Controller / API Layer (`server/modules/*/.*controller.ts`)
- **Nhiệm vụ:**
  - Nhận HTTP Request (Headers, Params, Query, Body).
  - Xác thực authentication (JWT token qua `authGuard`).
  - Kiểm tra authorization (Permissions/Roles qua `requirePermission`).
  - Validate payload đầu vào bằng Zod schema.
  - Chuyển giao dữ liệu đã validate cho Service.
  - Chuẩn hóa response theo format JSON thống nhất:
    ```json
    { "success": true, "data": {}, "message": null }
    { "success": false, "data": null, "message": "...", "code": "..." }
    ```

### 2.3. Service Layer (`server/modules/*/.*service.ts`)
- **Nhiệm vụ:**
  - Nơi duy nhất chứa nghiệp vụ (Business Rules).
  - Điều phối và gọi một hoặc nhiều Repository (ví dụ: `DepartmentRepository`, `AuditLogRepository`).
  - Thực hiện tính toán, xác thực nghiệp vụ logic, transactions.
  - Ghi nhận Audit Log tự động khi phát sinh hành động thay đổi dữ liệu.

### 2.4. Repository Layer (`server/modules/*/.*repository.ts`)
- **Nhiệm vụ:**
  - Đảm nhiệm duy nhất việc truy xuất dữ liệu thông qua Prisma Client.
  - Các hàm chuẩn: `findMany(filters, pagination)`, `findById(id)`, `create(data)`, `update(id, data)`, `delete(id)`.
  - Không chứa logic kiểm tra nghiệp vụ hay format HTTP response.

### 2.5. Database Layer (`prisma/`)
- **Nhiệm vụ:**
  - Lưu trữ dữ liệu thực sự (Real Relational Database).
  - Toàn vẹn dữ liệu: Khóa chính (Primary Key), Khóa ngoại (Foreign Keys), Unique constraints, Indexes.
  - Quản lý phiên bản cấu trúc qua Migration tuần tự.
  - Khởi tạo dữ liệu mẫu hợp lệ qua Seed CLI (`npm run db:seed`).

---

## 3. Cấu trúc Thư mục Dự án

```text
topkpi-clone/
│
├── prisma/
│   ├── schema.prisma              # Schema định nghĩa các Entity & Relations
│   ├── migrations/                # Migration files theo version
│   └── seed.ts                    # Script seed dữ liệu mẫu qua CLI
│
├── server/
│   ├── config/                    # Biến môi trường, JWT config
│   ├── middleware/                # Auth guard, RBAC permission guard, Error handler
│   ├── utils/                     # Response helper, Logger, Password hasher
│   └── modules/
│       ├── auth/                  # Module Đăng nhập & Token
│       ├── users/                 # Module Quản lý Nhân sự
│       ├── departments/           # Module Quản lý Bộ phận
│       ├── positions/             # Module Quản lý Chức vụ
│       ├── strategy-assessment/   # Module Canvas Đánh giá BSC Bước 1
│       ├── bsc-reports/           # Module Báo cáo BSC
│       ├── master-process/        # Module Quy trình lõi & hỗ trợ
│       ├── sla/                   # Module Quản lý SLA
│       └── audit-logs/            # Module Nhật ký kiểm toán
│
└── client/
    ├── src/
    │   ├── api/                   # API client (Axios/Fetch), TanStack Query hooks
    │   ├── components/            # Components tái sử dụng (Table, Modal, FormInput, Filter)
    │   ├── layouts/               # MainLayout (Header, Sidebar, UserDrawer, Ticket)
    │   ├── pages/                 # Login, Dashboard, AssessmentCanvas, Employees, etc.
    │   ├── context/               # AuthContext lưu user state và tokens
    │   ├── types/                 # TypeScript interfaces
    │   └── utils/                 # Formatters, CSS helpers
```

---

## 4. Xử lý Lỗi Tập trung (Centralized Error Handling)

Hệ thống sử dụng custom error class `AppError(statusCode, message, code)`:
- Mọi lỗi được bắt qua middleware `errorHandler` ở cuối Express pipeline.
- Trả về HTTP status code tương ứng (400, 401, 403, 404, 500) và format JSON chuẩn.
- Ghi log lỗi có timestamp, route, method và stack trace (ở môi trường phát triển).

---

## 5. Bảo mật & Xác thực

1. **Password Hashing:** Sử dụng thư viện `bcryptjs` với salt rounds chuẩn. Tuyệt đối không lưu plain text password.
2. **JWT Sessions:** Token chứa `userId`, `role`, thời hạn hết hạn (expiration).
3. **Phân quyền đa cấp:** Kiểm tra quyền ở cấp API backend trước khi truy cập service layer.
4. **Input Sanitization & Validation:** Mọi request body và query param đều được validate bằng Zod trước khi xử lý.
