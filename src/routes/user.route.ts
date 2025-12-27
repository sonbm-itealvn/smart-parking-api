import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { requireAdmin, requireOwnResourceOrAdmin } from "../middleware/role.middleware";

const router = Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Tạo user mới (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User được tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       403:
 *         description: Không có quyền truy cập
 */
router.post("/", requireAdmin, UserController.create);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy tất cả users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get("/", requireAdmin, UserController.getAll);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy user theo ID
 *     tags: [Users]
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
 *         description: Thông tin user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User không tồn tại
 */
router.get("/:id", requireOwnResourceOrAdmin, UserController.getById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Cập nhật user
 *     tags: [Users]
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
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               roleId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: User được cập nhật thành công
 *       404:
 *         description: User không tồn tại
 */
router.put("/:id", requireOwnResourceOrAdmin, UserController.update);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Xóa user (Admin only)
 *     tags: [Users]
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
 *         description: User được xóa thành công
 *       404:
 *         description: User không tồn tại
 *       403:
 *         description: Không có quyền truy cập
 */
router.delete("/:id", requireAdmin, UserController.delete);

/**
 * @swagger
 * /api/users/device-token:
 *   post:
 *     summary: Đăng ký device token để nhận push notification
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceToken
 *             properties:
 *               deviceToken:
 *                 type: string
 *                 description: FCM device token từ mobile app
 *     responses:
 *       200:
 *         description: Device token đã được đăng ký thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
router.post("/device-token", UserController.registerDeviceToken);

export default router;
