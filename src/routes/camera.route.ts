import { Router } from "express";
import { CameraController } from "../controllers/camera.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

/**
 * @swagger
 * /api/cameras:
 *   get:
 *     summary: Lấy tất cả camera (có thể filter theo parkingLotId)
 *     tags: [Cameras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parkingLotId
 *         schema:
 *           type: integer
 *         description: Filter theo ID bãi đỗ xe
 *     responses:
 *       200:
 *         description: Danh sách camera
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Camera'
 */
router.get("/", authenticateToken, CameraController.getAll);

/**
 * @swagger
 * /api/cameras/{id}:
 *   get:
 *     summary: Lấy thông tin camera theo ID
 *     tags: [Cameras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin camera
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Camera'
 *       404:
 *         description: Camera không tồn tại
 */
router.get("/:id", authenticateToken, CameraController.getById);

/**
 * @swagger
 * /api/cameras/{id}/stream:
 *   get:
 *     summary: Lấy stream URL của camera để truyền vào FastAPI endpoints
 *     tags: [Cameras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Stream URL và hướng dẫn sử dụng với FastAPI endpoints
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cameraId:
 *                   type: integer
 *                 cameraName:
 *                   type: string
 *                 streamUrl:
 *                   type: string
 *                   example: "rtsp://camera-ip:554/stream"
 *                 cameraType:
 *                   type: string
 *                   enum: [rtsp, http, webcam]
 *                 parkingLotId:
 *                   type: integer
 *                 parkingLotName:
 *                   type: string
 *                 usage:
 *                   type: object
 *                   description: Hướng dẫn sử dụng streamUrl với các FastAPI endpoints
 *       404:
 *         description: Camera không tồn tại
 *       400:
 *         description: Camera không active
 */
router.get("/:id/stream", authenticateToken, CameraController.getStreamUrl);

/**
 * @swagger
 * /api/cameras:
 *   post:
 *     summary: Tạo camera mới (Admin only)
 *     tags: [Cameras]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Camera'
 *     responses:
 *       201:
 *         description: Camera được tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post("/", authenticateToken, requireAdmin, CameraController.create);

/**
 * @swagger
 * /api/cameras/{id}:
 *   put:
 *     summary: Cập nhật camera (Admin only)
 *     tags: [Cameras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Camera'
 *     responses:
 *       200:
 *         description: Camera được cập nhật thành công
 *       404:
 *         description: Camera không tồn tại
 */
router.put("/:id", authenticateToken, requireAdmin, CameraController.update);

/**
 * @swagger
 * /api/cameras/{id}:
 *   delete:
 *     summary: Xóa camera (Admin only)
 *     tags: [Cameras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Camera được xóa thành công
 *       404:
 *         description: Camera không tồn tại
 */
router.delete("/:id", authenticateToken, requireAdmin, CameraController.delete);

/**
 * @swagger
 * /api/cameras/{id}/detect-license-plate:
 *   post:
 *     summary: Lấy frame từ camera stream và gọi FastAPI để detect biển số xe
 *     tags: [Cameras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của camera
 *     responses:
 *       200:
 *         description: Annotated PNG image với biển số được detect. Biển số được trả về trong header X-License-Plate
 *         headers:
 *           X-License-Plate:
 *             description: Biển số xe đã được nhận diện
 *             schema:
 *               type: string
 *               example: "30A-12345"
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Camera không active hoặc camera type không hỗ trợ
 *       404:
 *         description: Camera không tồn tại
 *       500:
 *         description: Lỗi server hoặc FastAPI
 */
router.post("/:id/detect-license-plate", authenticateToken, CameraController.detectLicensePlateFromCamera);

/**
 * @swagger
 * /api/cameras/{id}/detect-parking-space:
 *   post:
 *     summary: Lấy video từ camera stream và gọi FastAPI để nhận diện xe và check vị trí trống
 *     tags: [Cameras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của camera
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parkingLotId:
 *                 type: integer
 *                 description: ID của bãi đỗ xe (nếu camera chưa có parkingLotId)
 *     responses:
 *       200:
 *         description: Annotated PNG image với slot trống được đánh dấu. Hệ thống tự động detect xe, lấy tọa độ polygon của xe từ FastAPI, so khớp với tọa độ polygon của các slot trong DB bằng polygon intersection area. Nếu intersection area > 50% diện tích slot, slot sẽ được đánh dấu là OCCUPIED.
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Camera không active, camera type không hỗ trợ, hoặc thiếu parkingLotId
 *       404:
 *         description: Camera không tồn tại
 *       500:
 *         description: Lỗi server hoặc FastAPI
 */
router.post("/:id/detect-parking-space", authenticateToken, CameraController.detectParkingSpaceFromCamera);

export default router;

