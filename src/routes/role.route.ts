import { Router } from "express";
import { RoleController } from "../controllers/role.controller";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Tạo role mới (Admin only)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role được tạo thành công
 *       403:
 *         description: Không có quyền truy cập
 */
router.post("/", requireAdmin, RoleController.create);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Lấy tất cả roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 */
router.get("/", RoleController.getAll);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Lấy role theo ID
 *     tags: [Roles]
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
 *         description: Thông tin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 *       404:
 *         description: Role không tồn tại
 */
router.get("/:id", RoleController.getById);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Cập nhật role (Admin only)
 *     tags: [Roles]
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
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role được cập nhật thành công
 *       404:
 *         description: Role không tồn tại
 *       403:
 *         description: Không có quyền truy cập
 */
router.put("/:id", requireAdmin, RoleController.update);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Xóa role (Admin only)
 *     tags: [Roles]
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
 *         description: Role được xóa thành công
 *       404:
 *         description: Role không tồn tại
 *       403:
 *         description: Không có quyền truy cập
 */
router.delete("/:id", requireAdmin, RoleController.delete);

export default router;
