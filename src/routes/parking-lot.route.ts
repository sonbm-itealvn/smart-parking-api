import { Router } from "express";
import { ParkingLotController } from "../controllers/parking-lot.controller";
import { requireAdmin } from "../middleware/role.middleware";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/parking-lots:
 *   post:
 *     summary: Tạo bãi đỗ xe mới
 *     tags: [Parking Lots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParkingLot'
 *     responses:
 *       201:
 *         description: Bãi đỗ xe được tạo thành công
 */
router.post("/", requireAdmin, ParkingLotController.create);

/**
 * @swagger
 * /api/parking-lots:
 *   get:
 *     summary: Lấy tất cả bãi đỗ xe
 *     tags: [Parking Lots]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách bãi đỗ xe
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ParkingLot'
 */
router.get("/", ParkingLotController.getAll);

/**
 * @swagger
 * /api/parking-lots/{id}:
 *   get:
 *     summary: Lấy bãi đỗ xe theo ID
 *     tags: [Parking Lots]
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
 *         description: Thông tin bãi đỗ xe
 *       404:
 *         description: Bãi đỗ xe không tồn tại
 */
router.get("/:id", ParkingLotController.getById);

/**
 * @swagger
 * /api/parking-lots/{id}:
 *   put:
 *     summary: Cập nhật bãi đỗ xe
 *     tags: [Parking Lots]
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
 *             $ref: '#/components/schemas/ParkingLot'
 *     responses:
 *       200:
 *         description: Bãi đỗ xe được cập nhật thành công
 */
router.put("/:id", requireAdmin, ParkingLotController.update);

/**
 * @swagger
 * /api/parking-lots/{id}:
 *   delete:
 *     summary: Xóa bãi đỗ xe (Admin only)
 *     tags: [Parking Lots]
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
 *         description: Bãi đỗ xe được xóa thành công
 *       403:
 *         description: Không có quyền truy cập
 */
router.delete("/:id", requireAdmin, ParkingLotController.delete);

/**
 * @swagger
 * /api/parking-lots/{id}/vehicles:
 *   get:
 *     summary: Lấy danh sách xe trong bãi đỗ xe (tất cả status)
 *     tags: [Parking Lots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bãi đỗ xe
 *     responses:
 *       200:
 *         description: Danh sách xe trong bãi đỗ xe (bao gồm active, completed, cancelled)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parkingLot:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                 totalVehicles:
 *                   type: integer
 *                   description: Tổng số xe trong bãi đỗ (tất cả status)
 *                 vehicles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sessionId:
 *                         type: integer
 *                       licensePlate:
 *                         type: string
 *                       vehicleType:
 *                         type: string
 *                         enum: [car, motorcycle, truck]
 *                         nullable: true
 *                       isRegistered:
 *                         type: boolean
 *                         description: true nếu xe đã đăng ký, false nếu là xe vãng lai
 *                       status:
 *                         type: string
 *                         enum: [active, completed, cancelled]
 *                         description: Trạng thái của parking session
 *                       vehicle:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                           licensePlate:
 *                             type: string
 *                           vehicleType:
 *                             type: string
 *                           userId:
 *                             type: integer
 *                           user:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               fullName:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                       parkingSlot:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           slotCode:
 *                             type: string
 *                           status:
 *                             type: string
 *                       entryTime:
 *                         type: string
 *                         format: date-time
 *                       exitTime:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       fee:
 *                         type: number
 *                         nullable: true
 *       404:
 *         description: Bãi đỗ xe không tồn tại
 *       400:
 *         description: ID bãi đỗ xe không hợp lệ
 */
router.get("/:id/vehicles", authenticateToken, ParkingLotController.getVehiclesByParkingLot);

export default router;
