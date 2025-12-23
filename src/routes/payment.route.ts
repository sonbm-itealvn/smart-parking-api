import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";

const router = Router();

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Tạo thanh toán mới
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Payment'
 *     responses:
 *       201:
 *         description: Thanh toán được tạo thành công
 */
router.post("/", PaymentController.create);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Lấy tất cả thanh toán
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thanh toán
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 */
router.get("/", PaymentController.getAll);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Lấy thanh toán theo ID
 *     tags: [Payments]
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
 *         description: Thông tin thanh toán
 *       404:
 *         description: Thanh toán không tồn tại
 */
router.get("/:id", PaymentController.getById);

/**
 * @swagger
 * /api/payments/{id}:
 *   put:
 *     summary: Cập nhật thanh toán
 *     tags: [Payments]
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
 *             $ref: '#/components/schemas/Payment'
 *     responses:
 *       200:
 *         description: Thanh toán được cập nhật thành công
 */
router.put("/:id", PaymentController.update);

/**
 * @swagger
 * /api/payments/{id}:
 *   delete:
 *     summary: Xóa thanh toán
 *     tags: [Payments]
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
 *         description: Thanh toán được xóa thành công
 */
router.delete("/:id", PaymentController.delete);

export default router;
