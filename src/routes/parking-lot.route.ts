import { Router } from "express";
import { ParkingLotController } from "../controllers/parking-lot.controller";
import { requireAdmin } from "../middleware/role.middleware";

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

export default router;
