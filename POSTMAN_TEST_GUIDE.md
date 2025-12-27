# Hướng dẫn Test Endpoint Process Vehicle trên Postman

## Endpoint: `POST /api/cameras/{id}/process-vehicle`

Endpoint này nhận ảnh từ FE và gọi FastAPI để detect biển số xe, sau đó tự động quyết định VÀO/RA.

---

## Cách 1: Gửi imageUrl (Khuyến nghị)

### Bước 1: Upload ảnh lên server (nếu chưa có URL)

**Endpoint:** `POST /api/upload-images`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: multipart/form-data
```

**Body (form-data):**
- Key: `image` hoặc `file`
- Type: File
- Value: Chọn file ảnh từ máy tính

**Response:**
```json
{
  "message": "Image uploaded successfully",
  "image": {
    "id": 1,
    "url": "http://localhost:3000/uploads/images/xxx.jpg",
    ...
  }
}
```

**Lưu URL từ response** để dùng ở bước 2.

---

### Bước 2: Gọi process-vehicle với imageUrl

**Method:** `POST`

**URL:** `http://localhost:3000/api/cameras/8/process-vehicle`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "parkingLotId": 1,
  "slotId": 5,
  "imageUrl": "http://localhost:3000/uploads/images/xxx.jpg"
}
```

**Response khi xe VÀO:**
```json
{
  "message": "Vehicle entry processed successfully",
  "isRegistered": true,
  "vehicle": {
    "id": 1,
    "licensePlate": "30A-12345",
    "userId": 1
  },
  "parkingSession": {
    "id": 1,
    "vehicleId": 1,
    "licensePlate": "30A-12345",
    "parkingSlotId": 5,
    "entryTime": "2025-01-15T10:00:00.000Z",
    "status": "active"
  },
  "slot": {
    "id": 5,
    "slotCode": "A-05"
  },
  "notificationSent": true,
  "pushNotificationSent": true,
  "imageUrl": "http://localhost:3000/uploads/images/xxx.jpg"
}
```

**Response khi xe RA:**
```json
{
  "message": "Vehicle exit processed successfully",
  "isRegistered": true,
  "licensePlate": "30A-12345",
  "vehicle": {
    "id": 1,
    "licensePlate": "30A-12345",
    "userId": 1
  },
  "parkingSession": {
    "id": 1,
    "exitTime": "2025-01-15T13:00:00.000Z",
    "fee": 96300,
    "status": "completed"
  },
  "feeDetails": {
    "entryTime": "2025-01-15T10:00:00.000Z",
    "exitTime": "2025-01-15T13:00:00.000Z",
    "durationHours": 3,
    "totalFee": 96300,
    ...
  },
  "notificationSent": true,
  "pushNotificationSent": true,
  "imageUrl": "http://localhost:3000/uploads/images/xxx.jpg"
}
```

---

## Cách 2: Gửi imageBase64 (Fallback)

**Method:** `POST`

**URL:** `http://localhost:3000/api/cameras/8/process-vehicle`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "parkingLotId": 1,
  "slotId": 5,
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
}
```

**Lưu ý:** 
- Base64 string có thể rất dài
- Có thể gửi với hoặc không có prefix `data:image/jpeg;base64,`

---

## Cách 3: Không gửi ảnh (cho HTTP/RTSP Camera)

Nếu camera type là `http` hoặc `rtsp`, có thể không gửi ảnh, backend sẽ tự fetch từ camera stream.

**Method:** `POST`

**URL:** `http://localhost:3000/api/cameras/8/process-vehicle`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "parkingLotId": 1,
  "slotId": 5
}
```

---

## Các bước test trên Postman:

### 1. Lấy Access Token

**POST** `http://localhost:3000/api/auth/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Copy `accessToken` từ response.**

---

### 2. Upload ảnh (nếu dùng imageUrl)

**POST** `http://localhost:3000/api/upload-images`

**Headers:**
- `Authorization: Bearer YOUR_ACCESS_TOKEN`

**Body:**
- Chọn `form-data`
- Key: `image` (type: File)
- Value: Chọn file ảnh

**Copy `url` từ response.**

---

### 3. Test process-vehicle

**POST** `http://localhost:3000/api/cameras/8/process-vehicle`

**Headers:**
- `Authorization: Bearer YOUR_ACCESS_TOKEN`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "parkingLotId": 1,
  "slotId": 5,
  "imageUrl": "PASTE_URL_FROM_STEP_2"
}
```

---

## Test với ảnh có biển số xe:

1. **Lần đầu gọi** (xe chưa có active session) → Xe VÀO
   - Tạo parking session mới
   - Status: `active`
   - Gửi notification

2. **Lần thứ hai gọi** (xe đã có active session) → Xe RA
   - Cập nhật session
   - Tính tiền
   - Status: `completed`
   - Gửi notification với thông tin phí

---

## Lưu ý:

1. **Camera ID:** Thay `8` bằng ID camera thực tế của bạn
2. **parkingLotId:** Phải có trong DB hoặc set trong camera
3. **slotId:** Optional, nếu không có sẽ tự động tìm slot trống
4. **imageUrl:** Phải là URL có thể truy cập được (http/https)
5. **FastAPI:** Đảm bảo FastAPI service đang chạy và có thể truy cập được

---

## Troubleshooting:

### Lỗi 400: "parkingLotId is required"
→ Thêm `parkingLotId` vào body hoặc set trong camera

### Lỗi 400: "Webcam requires imageUrl or imageBase64"
→ Camera type là webcam, cần gửi `imageUrl` hoặc `imageBase64`

### Lỗi 400: "Could not detect license plate from camera frame"
→ **Xem file `DEBUG_LICENSE_PLATE_DETECTION.md` để debug chi tiết**
→ Kiểm tra:
  1. FastAPI service có đang chạy không (`http://localhost:8000`)
  2. Image URL có accessible từ FastAPI không
  3. Ảnh có biển số rõ ràng không
  4. Thử dùng `imageBase64` thay vì `imageUrl`

### Lỗi 500: "Failed to detect license plate"
→ Kiểm tra FastAPI service có đang chạy không
→ Kiểm tra logs để xem chi tiết lỗi
→ Xem response có thêm thông tin `imageUrl` và `details`

### Lỗi 404: "No available parking slot found"
→ Không còn slot trống trong bãi đỗ xe

---

## Ví dụ Request hoàn chỉnh:

```http
POST http://localhost:3000/api/cameras/8/process-vehicle HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "parkingLotId": 1,
  "slotId": 5,
  "imageUrl": "http://localhost:3000/uploads/images/camera-8-uuid-timestamp.jpg"
}
```

