import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Tạo thông báo mới
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       201:
 *         description: Thông báo được tạo thành công
 */
router.post("/", requireAdmin, NotificationController.create);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Lấy tất cả thông báo
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thông báo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get("/", NotificationController.getAll);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Lấy thông báo theo ID
 *     tags: [Notifications]
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
 *         description: Thông tin thông báo
 *       404:
 *         description: Thông báo không tồn tại
 */
router.get("/:id", NotificationController.getById);

/**
 * @swagger
 * /api/notifications/{id}:
 *   put:
 *     summary: Cập nhật thông báo
 *     tags: [Notifications]
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
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       200:
 *         description: Thông báo được cập nhật thành công
 */
router.put("/:id", requireAdmin, NotificationController.update);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Xóa thông báo (Admin only)
 *     tags: [Notifications]
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
 *         description: Thông báo được xóa thành công
 *       403:
 *         description: Không có quyền truy cập
 */
router.delete("/:id", requireAdmin, NotificationController.delete);

export default router;
