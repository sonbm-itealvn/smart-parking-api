import axios from "axios";
import FormData from "form-data";
import fs from "fs";

/**
 * Service để gọi FastAPI
 * Các endpoint từ FastAPI:
 * - POST /parking-space/recommend - Upload image/video để nhận annotated PNG với slot trống gần nhất
 * - POST /parking-space/recommend-video - Tương tự nhưng cho video form-data
 * - POST /parking-space/annotate-video - Upload video để nhận MP4 với mọi frame được annotate
 * - POST /license-plate/detect - Upload image để nhận annotated PNG và biển số (qua response header)
 * - GET /license-plate/logs - Lấy tất cả logged license plates
 */
class FastAPIService {
  private client: ReturnType<typeof axios.create>;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.FASTAPI_URL || "http://localhost:8000";
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000, // 60 seconds cho video processing
    });
  }

  /**
   * POST /parking-space/recommend
   * Upload image hoặc video để nhận annotated PNG với slot trống gần nhất
   * @param file File buffer, stream, hoặc đường dẫn đến file
   * @param fileName Tên file (required nếu file là buffer)
   * @param parkingLotId ID của bãi đỗ xe (optional)
   * @returns Annotated PNG image buffer
   */
  async recommendParkingSpace(
    file: string | Buffer | NodeJS.ReadableStream,
    fileName?: string,
    parkingLotId?: number
  ) {
    try {
      const formData = new FormData();
      
      if (typeof file === "string") {
        // File path
        formData.append("file", fs.createReadStream(file));
      } else if (Buffer.isBuffer(file)) {
        // File buffer
        formData.append("file", file, fileName || "image.jpg");
      } else {
        // Stream
        formData.append("file", file, fileName || "image.jpg");
      }
      
      if (parkingLotId) {
        formData.append("parking_lot_id", parkingLotId.toString());
      }

      const response = await this.client.post("/parking-space/recommend", formData, {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: "arraybuffer", // Nhận binary data (PNG)
      });

      return {
        image: Buffer.from(response.data as ArrayBuffer),
        contentType: response.headers["content-type"] || "image/png",
      };
    } catch (error: any) {
      console.error("Error calling FastAPI recommendParkingSpace:", error.message);
      throw error;
    }
  }

  /**
   * POST /parking-space/recommend-video
   * Upload video form-data để nhận annotated PNG với slot trống gần nhất
   * @param file File buffer, stream, hoặc đường dẫn đến file video
   * @param fileName Tên file (required nếu file là buffer)
   * @param parkingLotId ID của bãi đỗ xe (optional)
   * @returns Annotated PNG image buffer
   */
  async recommendParkingSpaceVideo(
    file: string | Buffer | NodeJS.ReadableStream,
    fileName?: string,
    parkingLotId?: number
  ) {
    try {
      const formData = new FormData();
      
      // FastAPI expect field name là "video" cho video endpoints
      if (typeof file === "string") {
        // File path
        formData.append("video", fs.createReadStream(file));
      } else if (Buffer.isBuffer(file)) {
        // File buffer
        formData.append("video", file, fileName || "video.mp4");
      } else {
        // Stream
        formData.append("video", file, fileName || "video.mp4");
      }
      
      if (parkingLotId) {
        formData.append("parking_lot_id", parkingLotId.toString());
      }

      const response = await this.client.post("/parking-space/recommend-video", formData, {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: "arraybuffer", // Nhận binary data (PNG)
      });

      return {
        image: Buffer.from(response.data as ArrayBuffer),
        contentType: response.headers["content-type"] || "image/png",
      };
    } catch (error: any) {
      console.error("Error calling FastAPI recommendParkingSpaceVideo:", error.message);
      throw error;
    }
  }

  /**
   * POST /parking-space/annotate-video
   * Upload video để nhận MP4 với mọi frame được annotate (ideal cho "real-time" playback)
   * @param file File buffer, stream, hoặc đường dẫn đến file video
   * @param fileName Tên file (required nếu file là buffer)
   * @param parkingLotId ID của bãi đỗ xe (optional)
   * @returns Annotated MP4 video buffer
   */
  async annotateVideo(
    file: string | Buffer | NodeJS.ReadableStream,
    fileName?: string,
    parkingLotId?: number
  ) {
    try {
      const formData = new FormData();
      
      // FastAPI expect field name là "video" cho video endpoints
      if (typeof file === "string") {
        // File path
        formData.append("video", fs.createReadStream(file));
      } else if (Buffer.isBuffer(file)) {
        // File buffer
        formData.append("video", file, fileName || "video.mp4");
      } else {
        // Stream
        formData.append("video", file, fileName || "video.mp4");
      }
      
      if (parkingLotId) {
        formData.append("parking_lot_id", parkingLotId.toString());
      }

      const response = await this.client.post("/parking-space/annotate-video", formData, {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: "arraybuffer", // Nhận binary data (MP4)
      });

      return {
        video: Buffer.from(response.data as ArrayBuffer),
        contentType: response.headers["content-type"] || "video/mp4",
      };
    } catch (error: any) {
      console.error("Error calling FastAPI annotateVideo:", error.message);
      throw error;
    }
  }

  /**
   * POST /license-plate/detect
   * Upload image để nhận annotated PNG và biển số (qua response header)
   * @param file File buffer, stream, hoặc đường dẫn đến file image
   * @param fileName Tên file (required nếu file là buffer)
   * @returns Annotated PNG image và license plate text từ header
   */
  async detectLicensePlate(
    file: string | Buffer | NodeJS.ReadableStream,
    fileName?: string
  ) {
    try {
      const formData = new FormData();
      
      // FastAPI expect field name là "image" chứ không phải "file"
      if (typeof file === "string") {
        // File path
        formData.append("image", fs.createReadStream(file));
      } else if (Buffer.isBuffer(file)) {
        // File buffer
        formData.append("image", file, fileName || "image.jpg");
      } else {
        // Stream
        formData.append("image", file, fileName || "image.jpg");
      }

      const response = await this.client.post("/license-plate/detect", formData, {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: "arraybuffer", // Nhận binary data (PNG)
      });

      // Lấy biển số từ response header
      const licensePlate = response.headers["x-license-plate"] || 
                          response.headers["license-plate"] || 
                          null;

      return {
        image: Buffer.from(response.data as ArrayBuffer),
        contentType: response.headers["content-type"] || "image/png",
        licensePlate: licensePlate,
      };
    } catch (error: any) {
      console.error("Error calling FastAPI detectLicensePlate:", error.message);
      
      // Log chi tiết error response từ FastAPI
      if (error.response) {
        console.error("FastAPI Error Response:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data ? Buffer.from(error.response.data).toString() : null,
        });
      }
      
      throw error;
    }
  }

  /**
   * GET /license-plate/logs
   * Lấy tất cả logged license plates
   * @returns Danh sách các biển số đã được log
   */
  async getLicensePlateLogs() {
    try {
      const response = await this.client.get("/license-plate/logs");
      return response.data;
    } catch (error: any) {
      console.error("Error calling FastAPI getLicensePlateLogs:", error.message);
      throw error;
    }
  }
}

export const fastAPIService = new FastAPIService();

