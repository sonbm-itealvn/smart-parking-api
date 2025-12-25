import { Router } from "express";
import { UploadImageController } from "../controllers/uploadImage.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { uploadImage } from "../middleware/upload.middleware";

const router = Router();

/**
 * @swagger
 * /api/upload-images:
 *   post:
 *     summary: Upload ảnh mới
 *     tags: [Upload Images]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         type: file
 *         required: true
 *         description: File ảnh cần upload
 *       - in: formData
 *         name: file
 *         type: file
 *         required: false
 *         description: File ảnh (alternative field name)
 *       - in: formData
 *         name: description
 *         type: string
 *         required: false
 *         description: Mô tả ảnh
 *     responses:
 *       201:
 *         description: Upload ảnh thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Image uploaded successfully
 *                 image:
 *                   $ref: '#/components/schemas/UploadedImage'
 *       400:
 *         description: File không hợp lệ hoặc thiếu file
 *       500:
 *         description: Lỗi server
 */
router.post("/", authenticateToken, uploadImage, UploadImageController.create);

/**
 * @swagger
 * /api/upload-images:
 *   get:
 *     summary: Lấy tất cả ảnh đã upload
 *     tags: [Upload Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         type: integer
 *         required: false
 *         description: Lọc theo userId
 *     responses:
 *       200:
 *         description: Danh sách ảnh
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UploadedImage'
 */
router.get("/", authenticateToken, UploadImageController.getAll);

/**
 * @swagger
 * /api/upload-images/{id}:
 *   get:
 *     summary: Lấy thông tin ảnh theo ID
 *     tags: [Upload Images]
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
 *         description: Thông tin ảnh
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadedImage'
 *       404:
 *         description: Ảnh không tồn tại
 */
router.get("/:id", authenticateToken, UploadImageController.getById);

/**
 * @swagger
 * /api/upload-images/{id}/file:
 *   get:
 *     summary: Lấy URL ảnh từ Cloudinary (redirect hoặc trả về JSON)
 *     tags: [Upload Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: redirect
 *         schema:
 *           type: boolean
 *         description: Nếu false, trả về JSON với URL. Mặc định redirect đến Cloudinary URL
 *     responses:
 *       200:
 *         description: Redirect đến Cloudinary URL hoặc trả về JSON với URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: "https://res.cloudinary.com/cloud_name/image/upload/v1234567890/smart-parking/abc123.jpg"
 *       302:
 *         description: Redirect đến Cloudinary URL
 *       404:
 *         description: Ảnh không tồn tại
 */
router.get("/:id/file", authenticateToken, UploadImageController.getImageFile);

/**
 * @swagger
 * /api/upload-images/{id}:
 *   put:
 *     summary: Cập nhật thông tin ảnh
 *     tags: [Upload Images]
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
 *               description:
 *                 type: string
 *                 description: Mô tả ảnh mới
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Image updated successfully
 *                 image:
 *                   $ref: '#/components/schemas/UploadedImage'
 *       403:
 *         description: Không có quyền cập nhật
 *       404:
 *         description: Ảnh không tồn tại
 */
router.put("/:id", authenticateToken, UploadImageController.update);

/**
 * @swagger
 * /api/upload-images/{id}:
 *   delete:
 *     summary: Xóa ảnh
 *     tags: [Upload Images]
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
 *         description: Xóa thành công
 *       403:
 *         description: Không có quyền xóa
 *       404:
 *         description: Ảnh không tồn tại
 */
router.delete("/:id", authenticateToken, UploadImageController.delete);

export default router;

