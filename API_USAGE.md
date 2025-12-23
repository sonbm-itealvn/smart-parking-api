# API Usage Guide

## Base URL
```
http://localhost:3000/api
```

## Authentication Flow

### 1. Register (Đăng ký)
```bash
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "password123",
  "roleId": 2  // Optional, default: 2 (User)
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "roleId": 2,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login (Đăng nhập)
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "roleId": 2,
    "role": {
      "id": 2,
      "name": "User"
    }
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Get Profile (Lấy thông tin user)
```bash
GET /api/auth/profile
Authorization: Bearer <token>
```

## Using Protected Endpoints

Tất cả các endpoints sau đây yêu cầu JWT token trong header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Example: Get All Parking Lots
```bash
GET /api/parking-lots
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Đăng ký (Public)
- `POST /api/auth/login` - Đăng nhập (Public)
- `GET /api/auth/profile` - Lấy thông tin user (Protected)

### Roles (Admin Only)
- `GET /api/roles` - Lấy tất cả roles
- `GET /api/roles/:id` - Lấy role theo ID
- `POST /api/roles` - Tạo role mới (Admin)
- `PUT /api/roles/:id` - Cập nhật role (Admin)
- `DELETE /api/roles/:id` - Xóa role (Admin)

### Users
- `GET /api/users` - Lấy tất cả users (Admin)
- `GET /api/users/:id` - Lấy user theo ID
- `POST /api/users` - Tạo user (Admin)
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user (Admin)

### Parking Lots
- `GET /api/parking-lots` - Lấy tất cả bãi đỗ xe
- `GET /api/parking-lots/:id` - Lấy bãi đỗ xe theo ID
- `POST /api/parking-lots` - Tạo bãi đỗ xe mới
- `PUT /api/parking-lots/:id` - Cập nhật bãi đỗ xe
- `DELETE /api/parking-lots/:id` - Xóa bãi đỗ xe

### Parking Slots
- `GET /api/parking-slots` - Lấy tất cả vị trí đỗ xe
- `GET /api/parking-slots/:id` - Lấy vị trí đỗ xe theo ID
- `POST /api/parking-slots` - Tạo vị trí đỗ xe mới
- `PUT /api/parking-slots/:id` - Cập nhật vị trí đỗ xe
- `DELETE /api/parking-slots/:id` - Xóa vị trí đỗ xe

### Vehicles
- `GET /api/vehicles` - Lấy tất cả phương tiện
- `GET /api/vehicles/:id` - Lấy phương tiện theo ID
- `POST /api/vehicles` - Đăng ký phương tiện mới
- `PUT /api/vehicles/:id` - Cập nhật thông tin phương tiện
- `DELETE /api/vehicles/:id` - Xóa phương tiện

### Notifications
- `GET /api/notifications` - Lấy tất cả thông báo
- `GET /api/notifications/:id` - Lấy thông báo theo ID
- `POST /api/notifications` - Tạo thông báo mới
- `PUT /api/notifications/:id` - Cập nhật thông báo
- `DELETE /api/notifications/:id` - Xóa thông báo

### Parking Sessions
- `GET /api/parking-sessions` - Lấy tất cả phiên đỗ xe
- `GET /api/parking-sessions/:id` - Lấy phiên đỗ xe theo ID
- `POST /api/parking-sessions` - Tạo phiên đỗ xe mới
- `PUT /api/parking-sessions/:id` - Cập nhật phiên đỗ xe
- `DELETE /api/parking-sessions/:id` - Xóa phiên đỗ xe

### Payments
- `GET /api/payments` - Lấy tất cả thanh toán
- `GET /api/payments/:id` - Lấy thanh toán theo ID
- `POST /api/payments` - Tạo thanh toán mới
- `PUT /api/payments/:id` - Cập nhật thanh toán
- `DELETE /api/payments/:id` - Xóa thanh toán

## Error Responses

### 400 Bad Request
```json
{
  "error": "Full name, email, and password are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token is required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 409 Conflict
```json
{
  "error": "User with this email already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Example: Complete Flow

### 1. Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 3. Refresh Access Token (khi access token hết hạn)
```bash
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token-here"
}
```

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "new-access-token",
  "refreshToken": "same-refresh-token"
}
```

### 4. Use Protected Endpoint
```bash
curl -X GET http://localhost:3000/api/parking-lots \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 5. Logout
```bash
POST /api/auth/logout
Content-Type: application/json

{
  "refreshToken": "your-refresh-token-here"
}
```

## Notes

- Token có thời hạn mặc định 7 ngày
- Sau khi token hết hạn, cần đăng nhập lại
- Tất cả passwords được hash bằng bcrypt
- Email phải đúng format và unique
- Password tối thiểu 6 ký tự

