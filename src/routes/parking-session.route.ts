import { Router } from "express";
import { ParkingSessionController } from "../controllers/parking-session.controller";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

/**
 * @swagger
 * /api/parking-sessions:
 *   post:
 *     summary: Tạo phiên đỗ xe mới
 *     tags: [Parking Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParkingSession'
 *     responses:
 *       201:
 *         description: Phiên đỗ xe được tạo thành công
 */
router.post("/", requireAdmin, ParkingSessionController.create);

/**
 * @swagger
 * /api/parking-sessions:
 *   get:
 *     summary: Lấy tất cả phiên đỗ xe (có thể filter theo parkingLotId và status)
 *     tags: [Parking Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parkingLotId
 *         schema:
 *           type: integer
 *         description: Filter theo ID bãi đỗ xe
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled]
 *         description: Filter theo trạng thái session
 *     responses:
 *       200:
 *         description: Danh sách phiên đỗ xe
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ParkingSession'
 */
router.get("/", ParkingSessionController.getAll);

/**
 * @swagger
 * /api/parking-sessions/my/current:
 *   get:
 *     summary: Lấy thông tin vị trí đang đỗ của user hiện tại
 *     tags: [Parking Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin vị trí đang đỗ (hoặc null nếu không có)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasActiveParking:
 *                   type: boolean
 *                   description: Có đang đỗ xe không
 *                 currentParking:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     session:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         entryTime:
 *                           type: string
 *                           format: date-time
 *                         licensePlate:
 *                           type: string
 *                           nullable: true
 *                         status:
 *                           type: string
 *                         durationHours:
 *                           type: number
 *                           description: Số giờ đã đỗ (làm tròn lên)
 *                     parkingSlot:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         slotCode:
 *                           type: string
 *                         status:
 *                           type: string
 *                         coordinates:
 *                           type: array
 *                           nullable: true
 *                     parkingLot:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         address:
 *                           type: string
 *                         pricePerHour:
 *                           type: number
 *                     vehicle:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                         licensePlate:
 *                           type: string
 *                         vehicleType:
 *                           type: string
 *       401:
 *         description: Chưa đăng nhập
 */
router.get("/my/current", ParkingSessionController.getMyCurrentParking);

/**
 * @swagger
 * /api/parking-sessions/{id}:
 *   get:
 *     summary: Lấy phiên đỗ xe theo ID
 *     tags: [Parking Sessions]
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
 *         description: Thông tin phiên đỗ xe
 *       404:
 *         description: Phiên đỗ xe không tồn tại
 */
router.get("/:id", ParkingSessionController.getById);

/**
 * @swagger
 * /api/parking-sessions/{id}:
 *   put:
 *     summary: Cập nhật phiên đỗ xe
 *     tags: [Parking Sessions]
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
 *             $ref: '#/components/schemas/ParkingSession'
 *     responses:
 *       200:
 *         description: Phiên đỗ xe được cập nhật thành công
 */
router.put("/:id", requireAdmin, ParkingSessionController.update);

/**
 * @swagger
 * /api/parking-sessions/{id}:
 *   delete:
 *     summary: Xóa phiên đỗ xe (Admin only)
 *     tags: [Parking Sessions]
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
 *         description: Phiên đỗ xe được xóa thành công
 *       403:
 *         description: Không có quyền truy cập
 */
router.delete("/:id", requireAdmin, ParkingSessionController.delete);

/**
 * @swagger
 * /api/parking-sessions/{id}/exit:
 *   post:
 *     summary: Tính tiền và cho xe ra khỏi bãi đỗ
 *     tags: [Parking Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của parking session
 *     responses:
 *       200:
 *         description: Xe đã ra khỏi bãi đỗ và phí đã được tính
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle exited successfully
 *                 parkingSession:
 *                   $ref: '#/components/schemas/ParkingSession'
 *                 feeDetails:
 *                   type: object
 *                   properties:
 *                     entryTime:
 *                       type: string
 *                       format: date-time
 *                     exitTime:
 *                       type: string
 *                       format: date-time
 *                     durationHours:
 *                       type: number
 *                       example: 3
 *                       description: Tổng số giờ đỗ xe
 *                     pricePerHour:
 *                       type: number
 *                       example: 30000
 *                       description: Giá mỗi giờ của bãi đỗ xe (từ parkingLot.pricePerHour)
 *                     firstHourFee:
 *                       type: number
 *                       example: 30000
 *                       description: Phí giờ đầu tiên (bằng pricePerHour)
 *                     increaseRate:
 *                       type: string
 *                       example: "10%"
 *                       description: Tỷ lệ tăng mỗi giờ
 *                     feeBreakdown:
 *                       type: array
 *                       description: Chi tiết phí từng giờ
 *                       items:
 *                         type: object
 *                         properties:
 *                           hour:
 *                             type: number
 *                             example: 1
 *                           fee:
 *                             type: number
 *                             example: 30000
 *                     totalFee:
 *                       type: number
 *                       format: decimal
 *                       example: 96300
 *                       description: Tổng phí (giờ 1: 30k, giờ 2: 33k, giờ 3: 36.3k)
 *       400:
 *         description: Session đã hoàn thành hoặc dữ liệu không hợp lệ
 *       404:
 *         description: Parking session không tồn tại
 */
router.post("/:id/exit", ParkingSessionController.exitVehicle);

export default router;
