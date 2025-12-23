import { Router } from "express";
import { FastAPIController } from "../controllers/fastapi.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { uploadImage, uploadVideo, uploadMixed } from "../middleware/upload.middleware";

const router = Router();

/**
 * @swagger
 * /api/parking-space/recommend:
 *   post:
 *     summary: Upload image hoặc video để nhận annotated PNG với slot trống gần nhất
 *     tags: [FastAPI - Parking Space]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Image hoặc video file
 *       - in: formData
 *         name: parkingLotId
 *         type: integer
 *         required: false
 *         description: ID của bãi đỗ xe (optional)
 *     responses:
 *       200:
 *         description: Annotated PNG image với slot trống được đánh dấu
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: File không hợp lệ hoặc thiếu file
 *       500:
 *         description: Lỗi server hoặc FastAPI
 */
router.post(
  "/parking-space/recommend",
  authenticateToken,
  uploadMixed,
  FastAPIController.recommendParkingSpace
);

/**
 * @swagger
 * /api/parking-space/recommend-video:
 *   post:
 *     summary: Upload video để nhận annotated PNG với slot trống gần nhất
 *     tags: [FastAPI - Parking Space]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Video file
 *       - in: formData
 *         name: parkingLotId
 *         type: integer
 *         required: false
 *         description: ID của bãi đỗ xe (optional)
 *     responses:
 *       200:
 *         description: Annotated PNG image với slot trống được đánh dấu
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: File không hợp lệ hoặc thiếu file
 *       500:
 *         description: Lỗi server hoặc FastAPI
 */
router.post(
  "/parking-space/recommend-video",
  authenticateToken,
  uploadVideo,
  FastAPIController.recommendParkingSpaceVideo
);

/**
 * @swagger
 * /api/parking-space/annotate-video:
 *   post:
 *     summary: Upload video để nhận MP4 với mọi frame được annotate
 *     tags: [FastAPI - Parking Space]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Video file
 *       - in: formData
 *         name: parkingLotId
 *         type: integer
 *         required: false
 *         description: ID của bãi đỗ xe (optional)
 *     responses:
 *       200:
 *         description: Annotated MP4 video với mọi frame được đánh dấu
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: File không hợp lệ hoặc thiếu file
 *       500:
 *         description: Lỗi server hoặc FastAPI
 */
router.post(
  "/parking-space/annotate-video",
  authenticateToken,
  uploadVideo,
  FastAPIController.annotateVideo
);

/**
 * @swagger
 * /api/license-plate/detect:
 *   post:
 *     summary: Upload image để nhận annotated PNG và biển số (qua response header)
 *     tags: [FastAPI - License Plate]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Image file
 *     responses:
 *       200:
 *         description: Annotated PNG image và biển số trong header X-License-Plate
 *         headers:
 *           X-License-Plate:
 *             description: Biển số xe đã được nhận diện
 *             schema:
 *               type: string
 *               example: "30A-12345"
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: File không hợp lệ hoặc thiếu file
 *       500:
 *         description: Lỗi server hoặc FastAPI
 */
router.post(
  "/license-plate/detect",
  authenticateToken,
  uploadImage,
  FastAPIController.detectLicensePlate
);

/**
 * @swagger
 * /api/license-plate/logs:
 *   get:
 *     summary: Lấy tất cả logged license plates
 *     tags: [FastAPI - License Plate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách các biển số đã được log
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   licensePlate:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Lỗi server hoặc FastAPI
 */
router.get(
  "/license-plate/logs",
  authenticateToken,
  FastAPIController.getLicensePlateLogs
);

export default router;

