import { Router } from "express";
import { ParkingSlotController } from "../controllers/parking-slot.controller";

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
router.post("/", ParkingSlotController.create);

/**
 * @swagger
 * /api/parking-slots:
 *   get:
 *     summary: Lấy tất cả vị trí đỗ xe
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
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
router.put("/:id", ParkingSlotController.update);

/**
 * @swagger
 * /api/parking-slots/{id}:
 *   delete:
 *     summary: Xóa vị trí đỗ xe
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
 */
router.delete("/:id", ParkingSlotController.delete);

export default router;
