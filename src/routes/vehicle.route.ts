import { Router } from "express";
import { VehicleController } from "../controllers/vehicle.controller";

const router = Router();

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Đăng ký phương tiện mới
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Vehicle'
 *     responses:
 *       201:
 *         description: Phương tiện được đăng ký thành công
 */
router.post("/", VehicleController.create);

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Lấy tất cả phương tiện
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách phương tiện
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehicle'
 */
router.get("/", VehicleController.getAll);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Lấy phương tiện theo ID
 *     tags: [Vehicles]
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
 *         description: Thông tin phương tiện
 *       404:
 *         description: Phương tiện không tồn tại
 */
router.get("/:id", VehicleController.getById);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     summary: Cập nhật thông tin phương tiện
 *     tags: [Vehicles]
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
 *             $ref: '#/components/schemas/Vehicle'
 *     responses:
 *       200:
 *         description: Phương tiện được cập nhật thành công
 */
router.put("/:id", VehicleController.update);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     summary: Xóa phương tiện
 *     tags: [Vehicles]
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
 *         description: Phương tiện được xóa thành công
 */
router.delete("/:id", VehicleController.delete);

export default router;
