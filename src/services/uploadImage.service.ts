import { v2 as cloudinary } from "cloudinary";
import { AppDataSource } from "../config/database";
import { UploadedImage } from "../entity/UploadedImage";
import { Readable } from "stream";

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

class UploadImageService {
  constructor() {
    // Kiểm tra cấu hình Cloudinary
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn("Warning: Cloudinary credentials not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file");
    }
  }

  /**
   * Upload ảnh lên Cloudinary và lưu metadata vào database
   * @param file File từ multer
   * @param userId ID của user upload (optional)
   * @param description Mô tả ảnh (optional)
   * @returns UploadedImage entity
   */
  async uploadImage(
    file: Express.Multer.File,
    userId?: number,
    description?: string
  ): Promise<UploadedImage> {
    try {
      // Upload lên Cloudinary
      const uploadResult = await new Promise<any>((resolve, reject) => {
        // Tạo stream từ buffer
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "smart-parking", // Folder trong Cloudinary
            resource_type: "image",
            allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
            transformation: [
              { quality: "auto" },
              { fetch_format: "auto" }
            ]
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        // Ghi buffer vào stream
        if (file.buffer) {
          const bufferStream = new Readable();
          bufferStream.push(file.buffer);
          bufferStream.push(null);
          bufferStream.pipe(uploadStream);
        } else {
          reject(new Error("File buffer is required"));
        }
      });

      // Lưu metadata vào database
      const repo = AppDataSource.getRepository(UploadedImage);
      const uploadedImage = repo.create({
        filename: uploadResult.public_id, // Cloudinary public_id
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: uploadResult.secure_url, // Lưu URL làm path (backward compatibility)
        url: uploadResult.secure_url, // URL từ Cloudinary
        userId: userId || null,
        description: description || null,
      });

      const savedImage = await repo.save(uploadedImage);
      return savedImage;
    } catch (error: any) {
      console.error("Error uploading image to Cloudinary:", error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Lấy tất cả ảnh đã upload
   * @param userId Filter theo userId (optional)
   * @returns Danh sách UploadedImage
   */
  async getAllImages(userId?: number): Promise<UploadedImage[]> {
    try {
      const repo = AppDataSource.getRepository(UploadedImage);
      const where: any = {};
      
      if (userId) {
        where.userId = userId;
      }

      const images = await repo.find({
        where,
        relations: ["user"],
        order: { createdAt: "DESC" },
      });

      return images;
    } catch (error: any) {
      console.error("Error getting all images:", error);
      throw new Error(`Failed to get images: ${error.message}`);
    }
  }

  /**
   * Lấy ảnh theo ID
   * @param id ID của ảnh
   * @returns UploadedImage hoặc null
   */
  async getImageById(id: number): Promise<UploadedImage | null> {
    try {
      const repo = AppDataSource.getRepository(UploadedImage);
      const image = await repo.findOne({
        where: { id },
        relations: ["user"],
      });

      return image;
    } catch (error: any) {
      console.error("Error getting image by id:", error);
      throw new Error(`Failed to get image: ${error.message}`);
    }
  }

  /**
   * Cập nhật thông tin ảnh
   * @param id ID của ảnh
   * @param description Mô tả mới (optional)
   * @returns UploadedImage đã cập nhật
   */
  async updateImage(id: number, description?: string): Promise<UploadedImage> {
    try {
      const repo = AppDataSource.getRepository(UploadedImage);
      const image = await repo.findOne({ where: { id } });

      if (!image) {
        throw new Error("Image not found");
      }

      if (description !== undefined) {
        image.description = description;
      }

      const updatedImage = await repo.save(image);
      return updatedImage;
    } catch (error: any) {
      console.error("Error updating image:", error);
      throw new Error(`Failed to update image: ${error.message}`);
    }
  }

  /**
   * Xóa ảnh từ Cloudinary và record trong database
   * @param id ID của ảnh
   */
  async deleteImage(id: number): Promise<void> {
    try {
      const repo = AppDataSource.getRepository(UploadedImage);
      const image = await repo.findOne({ where: { id } });

      if (!image) {
        throw new Error("Image not found");
      }

      // Xóa file từ Cloudinary (sử dụng public_id)
      try {
        await cloudinary.uploader.destroy(image.filename);
      } catch (cloudinaryError: any) {
        console.warn(`Failed to delete image from Cloudinary: ${cloudinaryError.message}`);
        // Tiếp tục xóa record trong DB ngay cả khi xóa Cloudinary thất bại
      }

      // Xóa record từ database
      await repo.remove(image);
    } catch (error: any) {
      console.error("Error deleting image:", error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Lấy URL ảnh từ Cloudinary
   * @param image UploadedImage entity
   * @returns URL của ảnh
   */
  getImageUrl(image: UploadedImage): string {
    return image.url || image.path;
  }
}

export const uploadImageService = new UploadImageService();

