# Hướng dẫn thiết lập Push Notification

## Tổng quan

Hệ thống đã được tích hợp push notification sử dụng Firebase Cloud Messaging (FCM) để gửi thông báo đến app của người dùng khi:
- Xe vào bãi đỗ
- Xe ra khỏi bãi đỗ

## Các bước thiết lập

### 1. Tạo Firebase Project và lấy FCM Server Key

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **Project Settings** > **Cloud Messaging**
4. Copy **Server key** (Legacy server key)
5. Thêm vào file `.env`:

```env
FCM_SERVER_KEY=your-fcm-server-key-here
```

### 2. Cập nhật Database Schema

Thêm cột `device_token` vào bảng `users`:

```sql
ALTER TABLE users 
ADD COLUMN device_token VARCHAR(500) NULL;
```

### 3. Đăng ký Device Token từ Mobile App

**Endpoint:** `POST /api/users/device-token`

**Cần xác thực:** Có (Bearer Token)

**Request Body:**
```json
{
  "deviceToken": "fcm-device-token-from-mobile-app"
}
```

**Response (200):**
```json
{
  "message": "Device token registered successfully",
  "userId": 1
}
```

**Lưu ý:**
- Device token được lấy từ Firebase SDK trong mobile app
- Mỗi user chỉ có thể có 1 device token (token mới sẽ ghi đè token cũ)
- Token cần được đăng ký lại khi user cài đặt lại app hoặc đăng nhập trên thiết bị mới

### 4. Flow hoạt động

#### Khi xe vào bãi đỗ:

1. Camera/FastAPI phát hiện xe và gọi webhook `/api/vehicle-detection`
2. Backend kiểm tra xe có trong database không
3. Nếu có:
   - Tạo parking session
   - Lưu notification vào database
   - **Gửi push notification đến app của user** (nếu có device token)

#### Khi xe ra khỏi bãi đỗ:

1. Camera/FastAPI phát hiện xe ra và gọi webhook
2. Backend tính tiền và cập nhật session
3. Nếu xe đã đăng ký:
   - Lưu notification vào database
   - **Gửi push notification với thông tin phí** (nếu có device token)

## Cấu trúc Push Notification

### Notification khi xe vào:

```json
{
  "title": "Xe đã vào bãi đỗ",
  "body": "Xe 30A-12345 đã vào bãi đỗ Trung tâm tại vị trí A-05",
  "data": {
    "type": "vehicle_entry",
    "licensePlate": "30A-12345",
    "slotCode": "A-05",
    "parkingLotName": "Bãi đỗ xe Trung tâm",
    "timestamp": "2025-01-15T10:00:00.000Z"
  }
}
```

### Notification khi xe ra:

```json
{
  "title": "Xe đã ra khỏi bãi đỗ",
  "body": "Xe 30A-12345 đã ra khỏi bãi đỗ. Tổng phí: 96,300 VNĐ",
  "data": {
    "type": "vehicle_exit",
    "licensePlate": "30A-12345",
    "totalFee": "96300",
    "timestamp": "2025-01-15T13:00:00.000Z"
  }
}
```

## API Endpoints

### 1. Đăng ký Device Token

**POST** `/api/users/device-token`

Đăng ký FCM device token để nhận push notification.

### 2. Lấy danh sách Notifications

**GET** `/api/notifications`

Lấy danh sách notifications của user (tự động lọc theo user đăng nhập).

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "message": "Xe của bạn (30A-12345) đã vào bãi đỗ tại vị trí A-05",
    "isRead": false,
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
]
```

## Xử lý lỗi

- Nếu `FCM_SERVER_KEY` không được cấu hình, hệ thống sẽ chỉ lưu notification vào database, không gửi push notification
- Nếu user chưa đăng ký device token, hệ thống sẽ chỉ lưu notification vào database
- Lỗi khi gửi push notification sẽ không làm fail request chính (chỉ log error)

## Testing

### Test với cURL:

1. Đăng ký device token:
```bash
curl -X POST http://localhost:3000/api/users/device-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "deviceToken": "test-device-token"
  }'
```

2. Test gửi notification (có thể tạo endpoint test riêng nếu cần)

## Lưu ý quan trọng

1. **FCM Server Key** phải được bảo mật, không commit vào git
2. Device token có thể thay đổi, cần đăng ký lại khi cần
3. Push notification là bất đồng bộ, không đảm bảo 100% delivery
4. Nên implement retry mechanism trong production
5. Có thể mở rộng để hỗ trợ multiple device tokens cho 1 user

## Mở rộng trong tương lai

- Hỗ trợ multiple device tokens cho 1 user
- Thêm notification preferences (user có thể tắt/bật từng loại notification)
- Thêm notification history và analytics
- Hỗ trợ rich notifications (hình ảnh, action buttons)

