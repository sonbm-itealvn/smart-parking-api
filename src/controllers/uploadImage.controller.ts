import { Request, Response } from "express";
import { uploadImageService } from "../services/uploadImage.service";
import { authenticateToken } from "../middleware/auth.middleware";

// Extend Request để có user info từ middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id?: number;
    userId?: number;
    email: string;
    roleId: number | string;
    roleName?: string;
  };
}

export class UploadImageController {
  /**
   * POST /api/upload-images
   * Upload ảnh mới
   */
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const file = files?.image?.[0] || files?.file?.[0];

      if (!file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      // Chỉ chấp nhận image files
      if (!file.mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "File must be an image" });
      }

      const userId = req.user?.id;
      const description = req.body.description || undefined;

      const uploadedImage = await uploadImageService.uploadImage(
        file,
        userId,
        description
      );

      return res.status(201).json({
        message: "Image uploaded successfully",
        image: uploadedImage,
      });
    } catch (error: any) {
      console.error("Error in create upload image:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/upload-images
   * Lấy tất cả ảnh đã upload
   */
  static async getAll(req: Request, res: Response) {
    try {
      const userId = req.query.userId 
        ? parseInt(req.query.userId as string) 
        : undefined;

      const images = await uploadImageService.getAllImages(userId);
      return res.json(images);
    } catch (error: any) {
      console.error("Error in getAll upload images:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/upload-images/:id
   * Lấy ảnh theo ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid image ID" });
      }

      const image = await uploadImageService.getImageById(id);

      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }

      return res.json(image);
    } catch (error: any) {
      console.error("Error in getById upload image:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/upload-images/:id/file
   * Redirect đến Cloudinary URL hoặc trả về URL
   */
  static async getImageFile(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid image ID" });
      }

      const image = await uploadImageService.getImageById(id);

      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }

      // Lấy URL từ Cloudinary
      const imageUrl = uploadImageService.getImageUrl(image);

      // Redirect đến Cloudinary URL hoặc trả về URL trong JSON
      if (req.query.redirect === "false") {
        return res.json({ url: imageUrl });
      }

      // Redirect đến Cloudinary URL
      return res.redirect(imageUrl);
    } catch (error: any) {
      console.error("Error in getImageFile:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/upload-images/:id
   * Cập nhật thông tin ảnh
   */
  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid image ID" });
      }

      // Kiểm tra quyền: chỉ owner hoặc admin mới được update
      const image = await uploadImageService.getImageById(id);
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }

      // Kiểm tra quyền sở hữu (nếu có user)
      // Admin: roleId = 2 (có thể là string "2" hoặc number 2)
      const userRoleId = req.user?.roleId;
      const userRoleName = req.user?.roleName || "";
      const isAdmin = req.user && (
        userRoleId === 2 || 
        userRoleId === "2" || 
        userRoleName.toUpperCase() === "ADMIN"
      );
      const userId = req.user?.id || req.user?.userId;
      if (image.userId && req.user && image.userId !== userId && !isAdmin) {
        return res.status(403).json({ error: "You don't have permission to update this image" });
      }

      const description = req.body.description;

      const updatedImage = await uploadImageService.updateImage(id, description);

      return res.json({
        message: "Image updated successfully",
        image: updatedImage,
      });
    } catch (error: any) {
      console.error("Error in update upload image:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/upload-images/:id
   * Xóa ảnh
   */
  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid image ID" });
      }

      // Kiểm tra quyền: chỉ owner hoặc admin mới được xóa
      const image = await uploadImageService.getImageById(id);
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }

      // Kiểm tra quyền sở hữu (nếu có user)
      // Admin: roleId = 2 (có thể là string "2" hoặc number 2)
      const userRoleId = req.user?.roleId;
      const userRoleName = req.user?.roleName || "";
      const isAdmin = req.user && (
        userRoleId === 2 || 
        userRoleId === "2" || 
        userRoleName.toUpperCase() === "ADMIN"
      );
      const userId = req.user?.id || req.user?.userId;
      if (image.userId && req.user && image.userId !== userId && !isAdmin) {
        return res.status(403).json({ error: "You don't have permission to delete this image" });
      }

      await uploadImageService.deleteImage(id);

      return res.status(204).send();
    } catch (error: any) {
      console.error("Error in delete upload image:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}

