# THIẾT KẾ CƠ SỞ DỮ LIỆU — DATABASE SPECIFICATION

Hệ thống sử dụng cơ sở dữ liệu quan hệ thực sự (Real Relational Database) qua **Prisma ORM**, mặc định cấu hình SQLite để chạy độc lập và linh hoạt chuyển đổi sang PostgreSQL thông qua biến môi trường `DATABASE_URL`.

---

## 1. Danh sách Bảng & Thực thể (Entities)

### 1.1. `roles` & `permissions`
- **`Role`**: Quản lý nhóm vai trò trong hệ thống (`ADMIN`, `MANAGER`, `STAFF`, `USER`).
- **`Permission`**: Quản lý chi tiết từng quyền thao tác (`users.view`, `users.create`, `departments.manage`, etc.).
- **`RolePermission`**: Bảng nối quan hệ n-n giữa vai trò và quyền.

### 1.2. `departments` (Bộ phận / Phòng ban)
- `id`: Khóa chính (UUID / CUID).
- `name`: Tên phòng ban (`NOT NULL`).
- `code`: Mã phòng ban (`UNIQUE`).
- `syncId`: Mã đồng bộ (`NULLABLE`).
- `abbreviation`: Tên viết tắt (`NULLABLE`).
- `parentId`: Khóa ngoại tự tham chiếu đến `departments.id` (quan hệ cây phân cấp cha-con).
- `managerId`: Khóa ngoại tham chiếu đến `users.id` (nhân sự phụ trách).
- `type`: Loại đơn vị (`DEPARTMENT`, `SUBSIDIARY`, `COMPANY`).
- `order`: Số thứ tự hiển thị.
- `description`: Mô tả.
- `createdAt`, `updatedAt`: Timestamps tự động.

### 1.3. `positions` (Chức vụ / Chức danh)
- `id`: Khóa chính.
- `name`: Tên chức vụ (`Trưởng phòng`, `Chuyên viên`, `Giám đốc`).
- `code`: Mã chức vụ (`UNIQUE`).
- `syncId`: Mã đồng bộ.
- `description`: Mô tả công việc.
- `status`: Trạng thái hoạt động (`ACTIVE`, `INACTIVE`).
- `createdAt`, `updatedAt`: Timestamps.

### 1.4. `users` (Nhân sự / Người dùng)
- `id`: Khóa chính.
- `email`: Email đăng nhập (`UNIQUE`, `NOT NULL`).
- `username`: Tên truy cập (`UNIQUE`, `NOT NULL`).
- `passwordHash`: Mật khẩu băm Bcrypt.
- `fullName`: Họ và tên.
- `employeeCode`: Mã nhân viên.
- `abbreviation`: Tên viết tắt.
- `gender`: Giới tính (`MALE`, `FEMALE`, `OTHER`).
- `phone`: Số điện thoại.
- `avatar`: URL hình đại diện.
- `roleId`: Khóa ngoại liên kết `roles.id`.
- `departmentId`: Khóa ngoại phòng ban chính `departments.id`.
- `positionId`: Khóa ngoại chức vụ chính `positions.id`.
- `kpiStartDate`: Ngày áp dụng KPI.
- `startDate`: Ngày vào làm.
- `subsystem`: Phân hệ (`BSC`, `KPI`, etc.).
- `status`: Trạng thái làm việc (`ACTIVE`, `PROBATION`, `LEAVE`).
- `language`: Ngôn ngữ hiển thị (`vi`, `en`).
- `createdAt`, `updatedAt`: Timestamps.

### 1.5. `employee_assignments` (Kiêm nhiệm phòng ban)
- `id`: Khóa chính.
- `userId`: Tham chiếu `users.id`.
- `departmentId`: Tham chiếu `departments.id`.
- `roleName`: Nhóm quyền kiêm nhiệm.
- `kpiStartDate`: Ngày áp dụng KPI kiêm nhiệm.
- `endDate`: Ngày kết thúc.

### 1.6. `strategy_assessments` (BƯỚC 1 ĐÁNH GIÁ - Chiến lược BSC)
- `id`: Khóa chính.
- `organization`: Tên tổ chức/công ty (Mặc định: `Công ty`).
- `stage`: Giai đoạn (Mặc định: `Giai đoạn 1`).
- `vision`: Bức tranh tầm nhìn doanh nghiệp.
- `companyStrengths`: Điểm mạnh công ty (JSON / Text).
- `competitorStrengths`: Điểm mạnh đối thủ (JSON / Text).
- `industrySuccessFactors`: Yếu tố thành công ngành (JSON / Text).
- `competitors`: Danh sách đối thủ cạnh tranh (JSON / Text).
- `competitiveAdvantage`: Lợi thế cạnh tranh của doanh nghiệp (JSON / Text).
- `createdAt`, `updatedAt`: Timestamps.

### 1.7. `bsc_reports` (Báo cáo BSC)
- `id`: Khóa chính.
- `name`: Tên báo cáo.
- `period`: Kỳ báo cáo (ví dụ: `Quý 1/2026`, `Năm 2026`).
- `frequency`: Tần suất (`MONTHLY`, `QUARTERLY`, `YEARLY`).
- `authorId`: Người lập báo cáo.
- `status`: Trạng thái (`DRAFT`, `PUBLISHED`).
- `createdAt`, `updatedAt`: Timestamps.

### 1.8. `master_processes` (Quy trình tổng thể)
- `id`: Khóa chính.
- `title`: Tên quy trình / văn bản.
- `category`: Phân loại (`CORE` - Quy trình lõi, `SUPPORT` - Quy trình hỗ trợ, `DOCUMENT` - Văn bản).
- `code`: Mã quy trình.
- `version`: Phiên bản.
- `departmentId`: Phòng ban phụ trách.
- `description`: Mô tả.
- `status`: Trạng thái.
- `createdAt`, `updatedAt`: Timestamps.

### 1.9. `sla_groups` & `sla_items` (Quản lý SLA)
- `SlaGroup`: `id`, `name`, `description`.
- `SlaItem`: `id`, `groupId`, `taskType` (Loại công việc), `durationHours` (Thời gian SLA - giờ), `status`.

### 1.10. `audit_logs` (Nhật ký kiểm toán)
- `id`: Khóa chính.
- `userId`: ID người thực hiện (nếu có).
- `userEmail`: Email người thực hiện.
- `action`: Thao tác (`LOGIN`, `CREATE`, `UPDATE`, `DELETE`, `LOGOUT`).
- `entity`: Đối tượng (`User`, `Department`, `Position`, `StrategyAssessment`, `Process`).
- `entityId`: Khóa của đối tượng bị tác động.
- `oldValue`: Giá trị cũ (JSON text).
- `newValue`: Giá trị mới (JSON text).
- `ipAddress`: Địa chỉ IP.
- `createdAt`: Thời điểm ghi nhận.

---

## 2. Quy trình Migration & Seed Data

1. **Migration Schema:**
   - Các file migration nằm tại `prisma/migrations/`.
   - Lệnh áp dụng migration:
     ```bash
     npm run db:migrate
     ```
2. **Seed Data:**
   - Khởi tạo đầy đủ:
     * 4 Roles (`Admin`, `Manager`, `Staff`, `User`) kèm permissions.
     * Tài khoản Quản trị viên mẫu: `Thuankhanh.hust@gmail.com` / `12345!` (mật khẩu đã băm).
     * Cơ cấu phòng ban ban đầu: Ban Giám đốc, Phòng Kỹ thuật & Công nghệ, Phòng Kinh doanh, Phòng Nhân sự.
     * Danh sách chức vụ mẫu: Giám đốc điều hành, Trưởng phòng, Chuyên viên cao cấp.
     * Dữ liệu mẫu Chiến lược BSC Bước 1.
   - Lệnh chạy seed:
     ```bash
     npm run db:seed
     ```
   - **Cam kết:** Không hardcode dữ liệu mock trong component giao diện. Mọi dữ liệu hiển thị đều được truy xuất từ cơ sở dữ liệu qua REST API.
