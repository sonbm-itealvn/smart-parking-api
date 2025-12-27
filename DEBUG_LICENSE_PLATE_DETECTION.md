# Hướng dẫn Debug: "Could not detect license plate from camera frame"

## Nguyên nhân có thể:

### 1. FastAPI Service không chạy hoặc không truy cập được

**Kiểm tra:**
```bash
# Kiểm tra FastAPI có đang chạy không
curl http://localhost:8000/health
# hoặc
curl http://localhost:8000/docs
```

**Giải pháp:**
- Đảm bảo FastAPI service đang chạy
- Kiểm tra `FASTAPI_URL` trong `.env` file
- Mặc định: `http://localhost:8000`

---

### 2. Image URL không truy cập được từ FastAPI

**Kiểm tra:**
```bash
# Test xem URL có truy cập được không
curl -I http://localhost:3000/uploads/images/xxx.jpg
```

**Vấn đề có thể:**
- URL là `localhost` nhưng FastAPI chạy trên container/network khác
- URL không public (chỉ accessible từ localhost)
- Firewall chặn

**Giải pháp:**
- Nếu FastAPI chạy trong Docker/network khác, dùng IP thay vì localhost
- Hoặc dùng public URL
- Hoặc gửi base64 thay vì URL

---

### 3. Ảnh không có biển số hoặc biển số không rõ

**Kiểm tra:**
- Mở ảnh và xem có biển số rõ ràng không
- Biển số có bị che khuất, mờ, hoặc góc chụp không tốt không

**Giải pháp:**
- Dùng ảnh có biển số rõ ràng
- Đảm bảo biển số chiếm đủ phần trong ảnh
- Thử với ảnh khác

---

### 4. FastAPI Model không detect được

**Kiểm tra logs:**
- Xem console logs của backend
- Xem logs của FastAPI service

**Logs sẽ hiển thị:**
```
[Camera 8] Sending image URL to FastAPI: http://...
[FastAPI Service] Fetching image from URL: http://...
[FastAPI Service] Successfully fetched image, size: xxx bytes
[FastAPI Service] FastAPI response status: 200
[FastAPI Service] Detected license plate: null
```

**Giải pháp:**
- Kiểm tra FastAPI model có hoạt động đúng không
- Test trực tiếp với FastAPI endpoint
- Cập nhật model nếu cần

---

## Cách Debug:

### Bước 1: Kiểm tra FastAPI Service

**Test trực tiếp FastAPI:**
```bash
curl -X POST http://localhost:8000/license-plate/detect \
  -F "image=@/path/to/image.jpg" \
  -v
```

**Kiểm tra response header:**
```bash
curl -X POST http://localhost:8000/license-plate/detect \
  -F "image=@/path/to/image.jpg" \
  -I
```

Nếu không có header `X-License-Plate` → FastAPI không detect được

---

### Bước 2: Kiểm tra Image URL

**Test URL có accessible không:**
```bash
# Từ máy local
curl -I http://localhost:3000/uploads/images/xxx.jpg

# Từ FastAPI service (nếu chạy trong Docker)
docker exec <fastapi-container> curl -I http://host.docker.internal:3000/uploads/images/xxx.jpg
```

**Nếu URL không accessible từ FastAPI:**
- Dùng IP thay vì localhost: `http://192.168.x.x:3000/uploads/images/xxx.jpg`
- Hoặc dùng public URL
- Hoặc gửi base64 thay vì URL

---

### Bước 3: Test với Base64 thay vì URL

**Request:**
```json
POST /api/cameras/8/process-vehicle
{
  "parkingLotId": 1,
  "slotId": 5,
  "imageBase64": "data:image/jpeg;base64,..."
}
```

Nếu base64 work nhưng URL không work → Vấn đề là URL không accessible từ FastAPI

---

### Bước 4: Kiểm tra Logs

**Backend logs sẽ hiển thị:**
```
[Camera 8] Sending image URL to FastAPI: http://localhost:3000/uploads/images/xxx.jpg
[Camera 8] Image URL is accessible, status: 200
[FastAPI Service] Fetching image from URL: http://localhost:3000/uploads/images/xxx.jpg
[FastAPI Service] Successfully fetched image, size: 123456 bytes
[FastAPI Service] FastAPI response status: 200
[FastAPI Service] Detected license plate: null
[Camera 8] FastAPI did not detect license plate from image
```

**FastAPI logs:**
- Kiểm tra logs của FastAPI service
- Xem có error gì không

---

## Giải pháp nhanh:

### Option 1: Dùng Base64 thay vì URL

```json
{
  "parkingLotId": 1,
  "slotId": 5,
  "imageBase64": "data:image/jpeg;base64,..."
}
```

### Option 2: Fix URL để accessible từ FastAPI

**Nếu FastAPI chạy trong Docker:**
```env
BASE_URL=http://host.docker.internal:3000
```

**Hoặc dùng IP:**
```env
BASE_URL=http://192.168.1.100:3000
```

### Option 3: Test trực tiếp với FastAPI

```bash
# Upload ảnh trực tiếp
curl -X POST http://localhost:8000/license-plate/detect \
  -F "image=@test-image.jpg" \
  -v
```

---

## Checklist Debug:

- [ ] FastAPI service đang chạy?
- [ ] FastAPI URL đúng trong `.env`?
- [ ] Image URL có thể truy cập được từ FastAPI?
- [ ] Ảnh có biển số rõ ràng?
- [ ] Test với base64 có work không?
- [ ] Kiểm tra logs của backend và FastAPI?
- [ ] FastAPI model có hoạt động đúng không?

---

## Response Error mới (có thêm thông tin):

```json
{
  "error": "Could not detect license plate from camera frame",
  "imageUrl": "http://localhost:3000/uploads/images/xxx.jpg",
  "suggestion": "Please ensure: 1) FastAPI service is running, 2) Image contains a clear license plate, 3) Image URL is accessible"
}
```

