# ĐẶC TẢ REST API — API SPECIFICATIONS

Toàn bộ các API đều tuân thủ chuẩn RESTful và sử dụng cấu trúc phản hồi đồng nhất (Unified JSON Response Envelope).

---

## 1. Cấu trúc Response Chuẩn

### Thành công (HTTP 200, 201)
```json
{
  "success": true,
  "data": { ... },
  "message": "Thông báo thành công (nếu có)"
}
```

### Thất bại (HTTP 400, 401, 403, 404, 500)
```json
{
  "success": false,
  "data": null,
  "message": "Mô tả nguyên nhân lỗi rõ ràng",
  "code": "ERROR_CODE_STRING"
}
```

---

## 2. Authentication & Profile Endpoints

### `POST /api/auth/login`
- **Request Body:**
  ```json
  {
    "username": "Thuankhanh.hust@gmail.com",
    "password": "..."
  }
  ```
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": "cuid...",
        "username": "Thuankhanh.hust@gmail.com",
        "email": "Thuankhanh.hust@gmail.com",
        "fullName": "Lê Thuận Khánh",
        "role": "Admin",
        "avatar": null
      }
    }
  }
  ```

### `GET /api/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response 200:** Trả về thông tin chi tiết user đang đăng nhập.

### `POST /api/auth/change-password`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** `{ "oldPassword": "...", "newPassword": "..." }`

---

## 3. Quản lý Nhân sự (Employees / Users)

### `GET /api/users`
- **Query params:** `page=1&limit=20&search=...&departmentId=...&positionId=...&roleId=...&status=ACTIVE`
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "...",
          "fullName": "Lê Thuận Khánh",
          "phone": "0987654321",
          "position": { "name": "Giám đốc" },
          "department": { "name": "Ban Giám Đốc" },
          "role": { "name": "Admin" },
          "startDate": "2024-01-01",
          "kpiStartDate": "2024-02-01",
          "status": "ACTIVE"
        }
      ],
      "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
    }
  }
  ```

### `POST /api/users`
- **Body:** `{ fullName, email, username, password, departmentId, positionId, roleId, phone, gender, kpiStartDate, startDate, subsystem, assignments }`

### `PUT /api/users/:id`
- **Body:** Cập nhật thông tin nhân sự.

### `DELETE /api/users/:id`
- Xóa hoặc vô hiệu hóa nhân sự (Soft delete / Set inactive).

---

## 4. Quản lý Bộ phận & Chức vụ

### `GET /api/departments`
- Trả về danh sách bộ phận dạng phân cấp cây và phẳng.

### `POST /api/departments`
- Thêm bộ phận mới (`name`, `code`, `parentId`, `managerId`, `type`, `order`, `description`).

### `GET /api/positions` & `POST /api/positions`
- Lấy danh sách và tạo chức vụ mới (`name`, `code`, `description`).

---

## 5. Chiến lược BSC & Đánh giá (Step 1 Assessment)

### `GET /api/strategy-assessment`
- **Query params:** `organization=Công ty&stage=Giai đoạn 1`
- **Response 200:** Trả về 5 node chiến lược và bức tranh tầm nhìn.

### `POST /api/strategy-assessment`
- **Body:**
  ```json
  {
    "organization": "Công ty",
    "stage": "Giai đoạn 1",
    "vision": "Bức tranh tầm nhìn 2026...",
    "companyStrengths": ["Đội ngũ kỹ sư tinh nhuệ", "Công nghệ tự động hóa"],
    "competitorStrengths": ["Quy mô vốn lớn"],
    "industrySuccessFactors": ["Tối ưu chi phí", "Tốc độ triển khai"],
    "competitors": ["Đối thủ A", "Đối thủ B"],
    "competitiveAdvantage": ["Dịch vụ tận tâm", "Hệ thống BSC chuẩn hóa"]
  }
  ```

---

## 6. Audit Logs Endpoints

### `GET /api/audit-logs`
- **Headers:** `Authorization: Bearer <token>` (Admin only)
- **Query params:** `page=1&limit=50&action=...&entity=...`
- **Response 200:** Danh sách nhật ký thao tác trong hệ thống.
