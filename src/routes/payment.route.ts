import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { requireAdmin } from "../middleware/role.middleware";
import { authenticateToken } from "../middleware/auth.middleware";

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
router.put("/:id", requireAdmin, PaymentController.update);

/**
 * @swagger
 * /api/payments/{id}:
 *   delete:
 *     summary: Xóa thanh toán (Admin only)
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
 *       403:
 *         description: Không có quyền truy cập
 */
router.delete("/:id", requireAdmin, PaymentController.delete);

/**
 * @swagger
 * /api/payments/revenue/daily:
 *   get:
 *     summary: Tính tổng doanh thu trong ngày
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-01-15"
 *         description: Ngày cần tính doanh thu (YYYY-MM-DD). Mặc định là hôm nay
 *       - in: query
 *         name: parkingLotId
 *         schema:
 *           type: integer
 *         description: ID của bãi đỗ xe (optional). Nếu không có thì tính tổng tất cả bãi đỗ
 *     responses:
 *       200:
 *         description: Tổng doanh thu trong ngày
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   format: date
 *                   example: "2025-01-15"
 *                 parkingLot:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     location:
 *                       type: string
 *                 totalRevenue:
 *                   type: number
 *                   description: Tổng doanh thu từ parking_sessions.fee (chỉ tính các session đã completed trong ngày)
 *                   example: 500000
 *                 totalSessions:
 *                   type: integer
 *                   description: Tổng số session đã completed trong ngày
 *                   example: 10
 *                 currency:
 *                   type: string
 *                   example: "VND"
 *       400:
 *         description: Date format không hợp lệ hoặc parkingLotId không hợp lệ
 */
router.get("/revenue/daily", authenticateToken, PaymentController.getDailyRevenue);

export default router;
