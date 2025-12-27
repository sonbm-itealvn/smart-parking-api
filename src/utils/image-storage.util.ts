import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * Utility để lưu ảnh từ base64 vào disk và trả về URL
 */
export class ImageStorageUtil {
  private static readonly UPLOAD_DIR = path.join(process.cwd(), "uploads", "images");
  private static readonly BASE_URL = process.env.BASE_URL || "http://localhost:3000";

  /**
   * Đảm bảo thư mục upload tồn tại
   */
  private static ensureUploadDir(): void {
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  /**
   * Lưu ảnh từ base64 string vào disk và trả về URL
   * @param imageBase64 Base64 string (có thể có hoặc không có data URL prefix)
   * @param prefix Prefix cho tên file (optional)
   * @returns URL của ảnh đã lưu
   */
  static saveBase64Image(imageBase64: string, prefix: string = "camera"): string {
    try {
      this.ensureUploadDir();

      // Xử lý base64 string (loại bỏ prefix nếu có)
      let base64Data = imageBase64;
      let mimeType = "image/jpeg"; // Default

      if (imageBase64.includes(",")) {
        // Có data URL prefix
        const parts = imageBase64.split(",");
        const prefixPart = parts[0];
        base64Data = parts[1];

        // Extract mime type từ prefix
        const mimeMatch = prefixPart.match(/data:([^;]+)/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
      }

      // Decode base64
      const imageBuffer = Buffer.from(base64Data, "base64");

      // Xác định extension từ mime type
      let extension = "jpg";
      if (mimeType.includes("png")) {
        extension = "png";
      } else if (mimeType.includes("gif")) {
        extension = "gif";
      } else if (mimeType.includes("webp")) {
        extension = "webp";
      }

      // Tạo tên file unique
      const fileName = `${prefix}-${uuidv4()}-${Date.now()}.${extension}`;
      const filePath = path.join(this.UPLOAD_DIR, fileName);

      // Lưu file
      fs.writeFileSync(filePath, imageBuffer);

      // Trả về URL
      const imageUrl = `${this.BASE_URL}/uploads/images/${fileName}`;
      return imageUrl;
    } catch (error: any) {
      console.error("Error saving base64 image:", error);
      throw new Error(`Failed to save image: ${error.message}`);
    }
  }

  /**
   * Xóa ảnh từ disk
   * @param imageUrl URL của ảnh cần xóa
   */
  static deleteImage(imageUrl: string): void {
    try {
      // Extract filename từ URL
      const fileName = imageUrl.split("/").pop();
      if (fileName) {
        const filePath = path.join(this.UPLOAD_DIR, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error: any) {
      console.error("Error deleting image:", error);
      // Không throw error để không ảnh hưởng đến flow chính
    }
  }
}

