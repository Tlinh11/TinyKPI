# PHASE 1 — DISCOVERY & AUDIT REPORT
**Target Website:** `https://topkpi-linux.toppion.com.vn`  
**Referenced Account:** `Thuankhanh.hust@gmail.com` (Role: Admin)

---

## 1. Screen List (Danh sách màn hình đã audit)

| Màn hình | Route / URL | Mô tả chức năng & Layout |
|---|---|---|
| **Đăng nhập** | `/login/` | Card modal chia 2 cột: Cột trái metallic blue wave, cột phải form đăng nhập Antd/Tailwind với fieldset border input, toggle password, nút Đăng nhập. |
| **Dashboard Tổng quan** | `/dashboard/` | Chọn tổ chức (Công ty), nút Báo Cáo BSC, trạng thái "Chưa có mục tiêu", widget "Việc trong ngày". |
| **BƯỚC 1 ĐÁNH GIÁ (Chiến lược BSC)** | `/dashboard/step1` | Canvas đồ họa tương tác 5 node (Điểm mạnh công ty, Điểm mạnh đối thủ, Yếu tố thành công ngành, Đối thủ, Lợi thế cạnh tranh) xoay quanh Bức tranh tầm nhìn 3D. Toggle Tổng quan/Chi tiết, nút Lưu, Bước tiếp theo. |
| **Báo Cáo BSC** | `/dashboard/reports` | Bảng quản lý các báo cáo BSC (STT, Tên báo cáo, Thời gian, Tần suất, Thao tác), nút Tạo Báo Cáo. |
| **Master Process** | `/quy-trinh/master-process` | Quản lý quy trình theo 3 nhóm: Quy trình lõi, Quy trình hỗ trợ, Văn bản. Bộ lọc tìm kiếm, chức vụ, Xem dạng bảng, Import Excel/JSON, Thêm mới. |
| **Quản lý SLA** | `/quy-trinh/sla` | Quản lý nhóm SLA (bên trái) và danh sách loại công việc + thời gian SLA (bên phải), nút Thêm nhóm gốc. |
| **Danh Sách Bộ Phận** | `/thiet-lap/bo-phan` | Quản lý phòng ban/bộ phận công ty. Bảng phân cấp, tìm kiếm, nút "Tải cơ cấu", "Thêm mới". Modal thêm bộ phận (Tên bộ phận, Sync ID, Tên viết tắt, Bộ phận cha, Nhân sự nhập dữ liệu, Mô tả, Loại, Vị trí). |
| **Danh Sách Chức Vụ** | `/thiet-lap/chuc-vu` | Quản lý chức danh/vị trí (Tên, Mô tả, SyncID, Trạng thái, Thao tác), tìm kiếm, Thêm mới. |
| **Danh Sách Nhân Viên** | `/thiet-lap/nhan-vien` | Bảng nhân sự đầy đủ bộ lọc trực tiếp trên từng header cột (STT, Họ & tên tìm kiếm, Điện thoại, Chức vụ dropdown, Bộ phận dropdown, Nhóm quyền dropdown, Ngày làm việc, Ngày áp dụng KPI, Trạng thái, Thao tác). |
| **Modal Thêm Nhân Viên** | N/A (Popup) | Form 2 cột: Sync ID, Tên viết tắt, Họ tên, Mã NV, Giới tính, ĐT, Email, Username, Password, Ngôn ngữ, Phân hệ (BSC), Nhóm quyền, Bộ phận, Chức vụ, Ngày làm việc, Ngày áp dụng KPI, Mô tả, Avatar, Bảng kiêm nhiệm phòng ban. |
| **Tài Khoản / Profile Drawer** | Slide-over | Drawer kéo từ phải sang: Avatar tròn gradient `LK`, Tên, Email, Tag `Admin`, Cài đặt mật khẩu, Ngôn ngữ, Switch "Ẩn header khi cuộn", Nút Đăng xuất. |

---

## 2. Feature List (Danh sách tính năng nghiệp vụ)

1. **Authentication & Authorization**:
   - Đăng nhập xác thực tài khoản qua database thật.
   - Mã hóa mật khẩu bảo mật (Bcrypt).
   - Cấp JWT token và quản lý phiên đăng nhập an toàn.
   - Phân quyền RBAC (Role-Based Access Control) cho Admin, Manager, Staff, User.
   - Drawer thông tin tài khoản cá nhân, đổi mật khẩu, đăng xuất.
2. **Quản lý Cơ cấu tổ chức (Organizational Hierarchy)**:
   - Quản lý Bộ phận / Phòng ban (Cây phân cấp cha-con, loại bộ phận, vị trí, người phụ trách).
   - Quản lý Chức vụ / Chức danh công việc.
   - Quản lý Nhân sự (Thông tin cá nhân, tài khoản truy cập, phân hệ BSC, chức vụ, bộ phận, ngày bắt đầu KPI, kiêm nhiệm phòng ban).
   - Bộ lọc đa tiêu chí trực tiếp trên header bảng (Search tên, chọn chức vụ, chọn bộ phận, chọn nhóm quyền, trạng thái).
3. **Chiến lược BSC & Đánh giá mục tiêu (Strategy Assessment Canvas)**:
   - Canvas chiến lược "BƯỚC 1 ĐÁNH GIÁ": Kết nối 5 thành tố chiến lược với Bức tranh tầm nhìn doanh nghiệp.
   - Cho phép cập nhật từng nội dung chiến lược, lưu trữ trực tiếp vào database.
   - Báo cáo cân bằng BSC (Tạo báo cáo, chu kỳ theo dõi, tần suất).
4. **Master Process & Quản lý SLA**:
   - Quản trị quy trình lõi, quy trình hỗ trợ và văn bản định chế.
   - Thiết lập chuẩn cam kết dịch vụ nội bộ (SLA: nhóm SLA, loại công việc, thời gian tiêu chuẩn).
5. **Audit Logging & System Monitoring**:
   - Tự động ghi nhận nhật ký mọi hành động thêm/sửa/xóa và đăng nhập (Ai, Hành động gì, Trên đối tượng nào, Thời điểm).

---

## 3. Entity List & Data Model Mapping

| Entity | Bảng Database tương ứng | Mô tả & Quan hệ |
|---|---|---|
| **User** | `users` | Tài khoản nhân viên, liên kết với `roles`, `departments`, `positions`. |
| **Role** | `roles` | Nhóm quyền người dùng (`ADMIN`, `MANAGER`, `STAFF`, `USER`). |
| **Permission** | `permissions` | Danh mục quyền chi tiết, liên kết nhiều-nhiều với `roles`. |
| **Department** | `departments` | Phòng ban công ty, quan hệ đệ quy cha-con (`parentId` -> `departments.id`). |
| **Position** | `positions` | Chức vụ trong tổ chức. |
| **EmployeeAssignment** | `employee_assignments` | Phân công kiêm nhiệm phòng ban của nhân viên. |
| **StrategyAssessment**| `strategy_assessments` | Dữ liệu Canvas đánh giá chiến lược BSC theo tổ chức và giai đoạn. |
| **BscReport** | `bsc_reports` | Báo cáo BSC theo chu kỳ và tần suất. |
| **MasterProcess** | `master_processes` | Quy trình lõi, quy trình hỗ trợ, văn bản hướng dẫn. |
| **SlaGroup** | `sla_groups` | Nhóm danh mục SLA. |
| **SlaItem** | `sla_items` | Chi tiết loại công việc và thời gian cam kết SLA. |
| **AuditLog** | `audit_logs` | Nhật ký kiểm toán bảo mật và vận hành. |

---

## 4. Permission Matrix

| Quyền | Admin | Manager | Staff | User |
|---|:---:|:---:|:---:|:---:|
| `users.view` | ✅ | ✅ | ✅ | ❌ |
| `users.create_update` | ✅ | ✅ | ❌ | ❌ |
| `users.delete` | ✅ | ❌ | ❌ | ❌ |
| `departments.manage` | ✅ | ✅ | ❌ | ❌ |
| `positions.manage` | ✅ | ✅ | ❌ | ❌ |
| `bsc_strategy.manage`| ✅ | ✅ | ❌ | ❌ |
| `processes.manage` | ✅ | ✅ | ❌ | ❌ |
| `sla.manage` | ✅ | ✅ | ❌ | ❌ |
| `audit_logs.view` | ✅ | ❌ | ❌ | ❌ |

---

## 5. API List (REST Endpoints)

- **Auth:**
  - `POST /api/auth/login` — Đăng nhập & trả về JWT + User info
  - `GET /api/auth/me` — Lấy thông tin user hiện tại từ token
  - `POST /api/auth/change-password` — Đổi mật khẩu
- **Users / Employees:**
  - `GET /api/users` — Lấy danh sách nhân viên (hỗ trợ phân trang, search, filter theo chức vụ, bộ phận, nhóm quyền, trạng thái)
  - `GET /api/users/:id` — Xem chi tiết nhân viên
  - `POST /api/users` — Tạo mới nhân viên
  - `PUT /api/users/:id` — Cập nhật nhân viên
  - `DELETE /api/users/:id` — Xóa nhân viên
- **Departments:**
  - `GET /api/departments` — Danh sách cây phòng ban
  - `POST /api/departments` — Thêm phòng ban
  - `PUT /api/departments/:id` — Cập nhật phòng ban
  - `DELETE /api/departments/:id` — Xóa phòng ban
- **Positions:**
  - `GET /api/positions` — Danh sách chức vụ
  - `POST /api/positions` — Thêm chức vụ
  - `PUT /api/positions/:id` — Cập nhật chức vụ
  - `DELETE /api/positions/:id` — Xóa chức vụ
- **Strategy & BSC:**
  - `GET /api/strategy-assessment` — Lấy dữ liệu Canvas Bước 1 Đánh giá
  - `POST /api/strategy-assessment` — Lưu / cập nhật Canvas
  - `GET /api/bsc-reports` — Danh sách báo cáo BSC
  - `POST /api/bsc-reports` — Tạo báo cáo BSC
- **Processes & SLA:**
  - `GET /api/processes` — Danh sách Master Process
  - `POST /api/processes` — Tạo quy trình
  - `GET /api/sla` — Danh sách nhóm và tiêu chuẩn SLA
  - `POST /api/sla/groups` — Thêm nhóm SLA
  - `POST /api/sla/items` — Thêm công việc SLA
- **Audit Logs:**
  - `GET /api/audit-logs` — Danh sách nhật ký kiểm toán hệ thống
