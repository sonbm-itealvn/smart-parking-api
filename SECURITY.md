# Security Documentation

## Authentication & Authorization

### JWT Authentication
- Tất cả các API endpoints (trừ `/api/auth/*`) đều yêu cầu JWT access token
- Token được gửi trong header: `Authorization: Bearer <access-token>`
- **Access Token**: Thời hạn mặc định 15 phút (có thể cấu hình qua `JWT_EXPIRES_IN`)
- **Refresh Token**: Thời hạn mặc định 7 ngày (có thể cấu hình qua `JWT_REFRESH_EXPIRES_IN`)
- Refresh token được lưu trong database và có thể bị revoke

### Role-Based Access Control (RBAC)
- **Admin**: Có quyền truy cập tất cả endpoints
- **User**: Có quyền truy cập hạn chế

### Protected Endpoints

#### Admin Only:
- `POST /api/roles` - Tạo role mới
- `PUT /api/roles/:id` - Cập nhật role
- `DELETE /api/roles/:id` - Xóa role
- `POST /api/users` - Tạo user (nên dùng `/api/auth/register` cho user thường)
- `GET /api/users` - Xem tất cả users
- `DELETE /api/users/:id` - Xóa user

#### Authenticated Users:
- Tất cả các endpoints khác yêu cầu authentication

## API Endpoints

### Public Endpoints (Không cần authentication)

#### Register
```
POST /api/auth/register
Body: {
  "fullName": "string",
  "email": "string",
  "password": "string",
  "roleId": number (optional, default: 2)
}
```

#### Login
```
POST /api/auth/login
Body: {
  "email": "string",
  "password": "string"
}
Response: {
  "message": "Login successful",
  "user": {...},
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

#### Refresh Token
```
POST /api/auth/refresh-token
Body: {
  "refreshToken": "string"
}
Response: {
  "message": "Token refreshed successfully",
  "accessToken": "new-jwt-access-token",
  "refreshToken": "same-refresh-token"
}
```

#### Logout
```
POST /api/auth/logout
Body: {
  "refreshToken": "string"
}
Response: {
  "message": "Logout successful"
}
```

### Protected Endpoints (Cần authentication)

#### Get Profile
```
GET /api/auth/profile
Headers: {
  "Authorization": "Bearer <token>"
}
```

## CORS Configuration

CORS được cấu hình trong `src/app.ts`. Mặc định cho phép tất cả origins (`*`).

Để cấu hình cho production, thêm vào `.env`:
```
CORS_ORIGIN=https://your-frontend-domain.com
```

## Environment Variables

Tạo file `.env` với các biến sau:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_parking

# Server
PORT=3000

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Password Security

- Passwords được hash bằng bcrypt với 10 salt rounds
- Password tối thiểu 6 ký tự
- Password không bao giờ được trả về trong response

## Best Practices

1. **Production**: 
   - Đặt `JWT_SECRET` là một chuỗi ngẫu nhiên mạnh
   - Đặt `CORS_ORIGIN` thành domain frontend cụ thể
   - Đặt `synchronize: false` trong database config
   - Sử dụng HTTPS

2. **Token Storage**:
   - Lưu token ở client (localStorage hoặc httpOnly cookie)
   - Không gửi token trong URL

3. **Error Handling**:
   - Không tiết lộ thông tin chi tiết về lỗi cho client
   - Log errors ở server side

