import { Router } from "express";
import { VehicleDetectionController } from "../controllers/vehicle-detection.controller";

const router = Router();

/**
 * @swagger
 * /api/vehicle-detection:
 *   post:
 *     summary: Webhook endpoint để nhận thông tin từ FastAPI về nhận diện biển số xe
 *     tags: [Vehicle Detection]
 *     description: |
 *       FastAPI sẽ gọi endpoint này sau khi nhận diện biển số xe.
 *       - flag = 0: Xe vào
 *       - flag = 1: Xe ra
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - licensePlate
 *               - flag
 *             properties:
 *               licensePlate:
 *                 type: string
 *                 example: "30A-12345"
 *                 description: Biển số xe đã được nhận diện
 *               flag:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 0
 *                 description: "0 = Xe vào, 1 = Xe ra"
 *               slotId:
 *                 type: integer
 *                 example: 1
 *                 description: ID của slot (nếu FastAPI detect được)
 *               parkingLotId:
 *                 type: integer
 *                 example: 1
 *                 required: true
 *                 description: ID của bãi đỗ xe (BẮT BUỘC để đảm bảo xe được gán đúng bãi đỗ)
 *               image:
 *                 type: string
 *                 description: Ảnh xe dưới dạng base64 (optional)
 *     responses:
 *       200:
 *         description: Xử lý thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 isRegistered:
 *                   type: boolean
 *                 vehicle:
 *                   type: object
 *                 parkingSession:
 *                   type: object
 *                 slot:
 *                   type: object
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc xe đã có session active
 *       404:
 *         description: Không tìm thấy slot trống hoặc vehicle/session
 */
router.post("/", VehicleDetectionController.handleVehicleDetection);

export default router;

