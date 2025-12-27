import { Router } from "express";
import { ParkingSlotController } from "../controllers/parking-slot.controller";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

/**
 * @swagger
 * /api/parking-slots:
 *   post:
 *     summary: Tạo vị trí đỗ xe mới
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParkingSlot'
 *     responses:
 *       201:
 *         description: Vị trí đỗ xe được tạo thành công
 */
router.post("/", requireAdmin, ParkingSlotController.create);

/**
 * @swagger
 * /api/parking-slots:
 *   get:
 *     summary: Lấy tất cả vị trí đỗ xe (có thể filter theo parkingLotId)
 *     tags: [Parking Slots]
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
 *         description: Danh sách vị trí đỗ xe
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ParkingSlot'
 */
router.get("/", ParkingSlotController.getAll);

/**
 * @swagger
 * /api/parking-slots/{id}:
 *   get:
 *     summary: Lấy vị trí đỗ xe theo ID
 *     tags: [Parking Slots]
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
 *         description: Thông tin vị trí đỗ xe
 *       404:
 *         description: Vị trí đỗ xe không tồn tại
 */
router.get("/:id", ParkingSlotController.getById);

/**
 * @swagger
 * /api/parking-slots/{id}:
 *   put:
 *     summary: Cập nhật vị trí đỗ xe
 *     tags: [Parking Slots]
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
 *             $ref: '#/components/schemas/ParkingSlot'
 *     responses:
 *       200:
 *         description: Vị trí đỗ xe được cập nhật thành công
 */
router.put("/:id", requireAdmin, ParkingSlotController.update);

/**
 * @swagger
 * /api/parking-slots/{id}:
 *   delete:
 *     summary: Xóa vị trí đỗ xe (Admin only)
 *     tags: [Parking Slots]
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
 *         description: Vị trí đỗ xe được xóa thành công
 *       403:
 *         description: Không có quyền truy cập
 */
router.delete("/:id", requireAdmin, ParkingSlotController.delete);

/**
 * @swagger
 * /api/parking-slots/{id}/current-occupant:
 *   get:
 *     summary: Xem thông tin người đang đỗ tại vị trí này
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của vị trí đỗ xe
 *     responses:
 *       200:
 *         description: Thông tin người đang đỗ (hoặc null nếu vị trí trống)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parkingSlot:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     slotCode:
 *                       type: string
 *                     status:
 *                       type: string
 *                 isOccupied:
 *                   type: boolean
 *                   description: Vị trí có đang được sử dụng không
 *                 currentOccupant:
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
 *                     user:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                         fullName:
 *                           type: string
 *                         email:
 *                           type: string
 *       404:
 *         description: Vị trí đỗ xe không tồn tại
 */
router.get("/:id/current-occupant", ParkingSlotController.getCurrentOccupant);

export default router;
