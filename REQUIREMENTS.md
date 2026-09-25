# PROJECT CONTEXT — CLONE WEBSITE DEMO

## 1. Mục tiêu dự án
Xây dựng một web application mới có mục tiêu **clone lại giao diện, chức năng và các luồng nghiệp vụ chính của một website đã có sẵn**, phục vụ mục đích demo/prototype.

Target Website: `https://topkpi-linux.toppion.com.vn`

### Mục tiêu chính
* Clone lại UI/UX của website nguồn ở mức sát nhất có thể.
* Reproduce các màn hình, navigation, form, table, filter, popup, trạng thái và user flow quan trọng.
* Có hệ thống đăng nhập thật.
* Có database thật.
* Dữ liệu được đọc/ghi từ database thông qua backend/API.
* KHÔNG sử dụng mock data cho business flow.
* Có thể dễ dàng thay đổi business logic, database schema và UI về sau.
* Kiến trúc phải đủ chặt chẽ để tiếp tục phát triển thành sản phẩm thật.
* Ưu tiên code dễ đọc, dễ debug, dễ test và dễ mở rộng.

---

## 2. Nguyên tắc kiến trúc
KHÔNG xây dựng project theo kiểu: Frontend → gọi trực tiếp Database → xử lý logic trong component.
Không hard-code business logic vào UI.

Kiến trúc chuẩn:
```text
UI / Page
   ↓
Controller / API
   ↓
Service / Business Logic
   ↓
Repository / Data Access
   ↓
Database
```
Frontend và Backend tách trách nhiệm rõ ràng.

---

## 3. Công nghệ
- **Frontend**: React, TypeScript, Vite/Next.js, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form, Zod.
- **Backend**: Node.js, TypeScript, Express / NestJS (Layered: Controller → Service → Repository → Database).
- **Database**: PostgreSQL (hoặc SQLite/Postgres với Prisma/Drizzle migration rõ ràng, real database, seed data qua CLI).

---

## 4. Quy tắc trách nhiệm từng layer
- **Presentation Layer**: UI, layout, form, table, modal, loading/error state. Không chứa business logic hay DB call.
- **Controller / API Layer**: Routing, HTTP req/res, validation cơ bản, auth guard, gọi Service.
- **Service Layer**: Business rules, logic nghiệp vụ, transaction, gọi nhiều Repository khi cần.
- **Repository Layer**: Data access thuần túy (CRUD, queries).
- **Database Layer**: Schema chuẩn, Primary Key, Foreign Key, Index, Unique, Constraints, Timestamps, Migration.

---

## 5. Authentication & Authorization
- Auth thật: Hash password (bcrypt/argon2), JWT/Session thật.
- Role & Permission-based access control (Admin, Manager, Staff, User...).
- Frontend chỉ dùng permission để render UI; Backend enforce bảo mật thật.

---

## 6. API Design & Error Handling
- REST API chuẩn:
  ```json
  { "success": true, "data": {}, "message": null }
  { "success": false, "data": null, "message": "...", "code": "..." }
  ```
- Centralized error handler, HTTP status codes chuẩn.

---

## 7. Migration & Seed Data
- DB migration tuần tự (`001_...`, `002_...`).
- Seed command: `npm run db:seed`. Không hardcode mock data trong UI.

---

## 8. Quy trình thực hiện (6 Phases)
1. **Phase 1 — Discovery**: Audit website nguồn (Screens, Features, Flows, Entities, Permissions, APIs).
2. **Phase 2 — Architecture**: Thiết kế Project structure, DB schema, API contracts, Auth model.
3. **Phase 3 — Foundation**: Setup project, DB, Migration, Auth, Base API framework, Error handling.
4. **Phase 4 — Core Features**: Implement từng module theo full layers (DB → Repo → Service → API → UI).
5. **Phase 5 — UI Refinement**: So khớp pixel, spacing, typography, theme, responsive với web gốc.
6. **Phase 6 — Testing & Verification**: Kiểm tra E2E, CRUD, error handling, permission.
