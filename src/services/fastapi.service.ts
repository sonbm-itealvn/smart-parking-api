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

    // Timeout cho các request tới FastAPI (ms) – video annotate có thể rất lâu
    const defaultTimeoutMs = 600000; // 10 phút
    const configuredTimeoutMs = process.env.FASTAPI_TIMEOUT_MS
      ? Number(process.env.FASTAPI_TIMEOUT_MS)
      : defaultTimeoutMs;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: configuredTimeoutMs,
      // @ts-ignore - maxBodyLength và maxContentLength không có trong type definitions nhưng axios hỗ trợ
      maxBodyLength: Infinity,
      // @ts-ignore
      maxContentLength: Infinity,
    });
  }

  /**
   * POST /parking-space/recommend
   * Upload image hoặc video để nhận annotated PNG với slot trống gần nhất
   * @param file File buffer, stream, hoặc đường dẫn đến file
   * @param fileName Tên file (required nếu file là buffer)
   * @param parkingLotId ID của bãi đỗ xe (optional)
   * @returns Annotated PNG image buffer và tọa độ xe (nếu có)
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

      // Lấy tọa độ xe từ header hoặc response body nếu có
      const vehicleCoordinatesHeader = response.headers["x-vehicle-coordinates"] || 
                                      response.headers["vehicle-coordinates"];
      let vehicleCoordinates: number[][][] | null = null;
      
      if (vehicleCoordinatesHeader) {
        try {
          vehicleCoordinates = JSON.parse(vehicleCoordinatesHeader as string);
        } catch (e) {
          console.warn("Failed to parse vehicle coordinates from header:", e);
        }
      }

      return {
        image: Buffer.from(response.data as ArrayBuffer),
        contentType: response.headers["content-type"] || "image/png",
        vehicleCoordinates: vehicleCoordinates,
      };
    } catch (error: any) {
      console.error("Error calling FastAPI recommendParkingSpace:", error.message);
      throw error;
    }
  }

  /**
   * POST /parking-space/detect-vehicles
   * Upload image hoặc video để detect xe và lấy tọa độ của các xe
   * @param file File buffer, stream, hoặc đường dẫn đến file
   * @param fileName Tên file (required nếu file là buffer)
   * @param parkingLotId ID của bãi đỗ xe (optional)
   * @returns Tọa độ của các xe được detect (polygon coordinates)
   */
  async detectVehicles(
    file: string | Buffer | NodeJS.ReadableStream,
    fileName?: string,
    parkingLotId?: number
  ) {
    try {
      const formData = new FormData();
      
      if (typeof file === "string") {
        formData.append("file", fs.createReadStream(file));
      } else if (Buffer.isBuffer(file)) {
        formData.append("file", file, fileName || "image.jpg");
      } else {
        formData.append("file", file, fileName || "image.jpg");
      }
      
      if (parkingLotId) {
        formData.append("parking_lot_id", parkingLotId.toString());
      }

      const response = await this.client.post("/parking-space/detect-vehicles", formData, {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: "json", // Nhận JSON với tọa độ xe
      });

      // FastAPI trả về: { vehicles: [{ coordinates: [[[x1,y1], [x2,y2], ...]] }] }
      const data = response.data as { vehicles?: any[] };
      return {
        vehicles: data.vehicles || [],
      };
    } catch (error: any) {
      console.error("Error calling FastAPI detectVehicles:", error.message);
      throw error;
    }
  }

  /**
   * POST /parking-space/recommend-video
   * Upload video form-data để nhận annotated PNG với slot trống gần nhất
   * @param file File buffer, stream, hoặc đường dẫn đến file video
   * @param fileName Tên file (required nếu file là buffer)
   * @param parkingLotId ID của bãi đỗ xe (optional)
   * @returns Annotated PNG image buffer và tọa độ xe (nếu có)
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

      // Lấy tọa độ xe từ header nếu có
      const vehicleCoordinatesHeader = response.headers["x-vehicle-coordinates"] || 
                                      response.headers["vehicle-coordinates"];
      let vehicleCoordinates: number[][][] | null = null;
      
      if (vehicleCoordinatesHeader) {
        try {
          vehicleCoordinates = JSON.parse(vehicleCoordinatesHeader as string);
        } catch (e) {
          console.warn("Failed to parse vehicle coordinates from header:", e);
        }
      }

      return {
        image: Buffer.from(response.data as ArrayBuffer),
        contentType: response.headers["content-type"] || "image/png",
        vehicleCoordinates: vehicleCoordinates,
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
   * @param file File buffer, stream, đường dẫn đến file image, hoặc URL
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
        // Kiểm tra xem là URL hay file path
        if (file.startsWith("http://") || file.startsWith("https://")) {
          // Là URL - fetch ảnh từ URL và gửi cho FastAPI
          try {
            console.log(`[FastAPI Service] Fetching image from URL: ${file}`);
            const imageResponse = await axios.get(file, {
              responseType: "arraybuffer",
              timeout: 15000, // Tăng timeout lên 15s
              validateStatus: (status) => status === 200, // Chỉ accept status 200
            });
            
            if (!imageResponse.data || imageResponse.data.length === 0) {
              throw new Error("Image data is empty");
            }
            
            const imageBuffer = Buffer.from(imageResponse.data);
            console.log(`[FastAPI Service] Successfully fetched image, size: ${imageBuffer.length} bytes`);
            formData.append("image", imageBuffer, fileName || "image.jpg");
          } catch (urlError: any) {
            console.error(`[FastAPI Service] Error fetching image from URL ${file}:`, {
              message: urlError.message,
              status: urlError.response?.status,
              statusText: urlError.response?.statusText
            });
            throw new Error(`Failed to fetch image from URL: ${urlError.message}`);
          }
        } else {
          // File path
          formData.append("image", fs.createReadStream(file));
        }
      } else if (Buffer.isBuffer(file)) {
        // File buffer
        formData.append("image", file, fileName || "image.jpg");
      } else {
        // Stream
        formData.append("image", file, fileName || "image.jpg");
      }

      console.log(`[FastAPI Service] Sending request to FastAPI: ${this.baseURL}/license-plate/detect`);
      
      const response = await this.client.post("/license-plate/detect", formData, {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: "arraybuffer", // Nhận binary data (có thể là PNG hoặc JSON)
      });

      console.log(`[FastAPI Service] FastAPI response status: ${response.status}`);
      console.log(`[FastAPI Service] Content-Type: ${response.headers["content-type"]}`);
      console.log(`[FastAPI Service] All response headers:`, JSON.stringify(response.headers, null, 2));

      // Kiểm tra xem response là JSON hay binary image
      const contentType = response.headers["content-type"] || "";
      const isJsonResponse = contentType.includes("application/json");
      
      let licensePlate: string | null = null;
      let imageBuffer: Buffer;
      let finalContentType: string;

      if (isJsonResponse) {
        // FastAPI trả về JSON - parse từ body
        console.log(`[FastAPI Service] FastAPI returned JSON response, parsing body...`);
        try {
          const responseBody = Buffer.from(response.data as ArrayBuffer).toString("utf-8");
          const jsonData = JSON.parse(responseBody);
          
          console.log(`[FastAPI Service] JSON response body:`, JSON.stringify(jsonData, null, 2));
          
          // Thử nhiều field names phổ biến cho license plate trong JSON
          // Log tất cả keys để debug
          console.log(`[FastAPI Service] JSON keys:`, Object.keys(jsonData));
          
          // Ưu tiên 1: Kiểm tra mảng plates (FastAPI trả về dạng {plates: ["G01 55055"]})
          if (jsonData.plates && Array.isArray(jsonData.plates) && jsonData.plates.length > 0) {
            licensePlate = jsonData.plates[0];
            console.log(`[FastAPI Service] Found license plate in plates array: ${licensePlate}`);
          }
          // Ưu tiên 2: Kiểm tra details array (FastAPI trả về dạng {details: [{text: "G01 55055"}]})
          else if (jsonData.details && Array.isArray(jsonData.details) && jsonData.details.length > 0) {
            licensePlate = jsonData.details[0].text || jsonData.details[0].plate || null;
            if (licensePlate) {
              console.log(`[FastAPI Service] Found license plate in details array: ${licensePlate}`);
            }
          }
          // Ưu tiên 3: Kiểm tra các field names phổ biến
          else {
            licensePlate = jsonData.license_plate || 
                          jsonData.licensePlate || 
                          jsonData.license_plate_number ||
                          jsonData.licensePlateNumber ||
                          jsonData.plate || 
                          jsonData.detected_plate ||
                          jsonData.detectedPlate ||
                          jsonData.plate_number ||
                          jsonData.plateNumber ||
                          jsonData.number ||
                          jsonData.result?.license_plate ||
                          jsonData.result?.licensePlate ||
                          jsonData.result?.plate ||
                          jsonData.data?.license_plate ||
                          jsonData.data?.licensePlate ||
                          jsonData.data?.plate ||
                          null;
          }
          
          // Validate và clean license plate
          if (licensePlate && typeof licensePlate === "string") {
            licensePlate = licensePlate.trim();
            // Nếu là empty string hoặc các giá trị không hợp lệ, set thành null
            if (licensePlate === "" || 
                licensePlate.toLowerCase() === "null" || 
                licensePlate.toLowerCase() === "none" ||
                licensePlate === "undefined" ||
                licensePlate === "N/A") {
              licensePlate = null;
            }
          }
          
          // Nếu vẫn null, log toàn bộ JSON để debug
          if (!licensePlate) {
            console.warn(`[FastAPI Service] License plate not found. Checked: plates array, details array, and common fields.`);
            console.warn(`[FastAPI Service] JSON structure:`, {
              hasPlates: !!jsonData.plates,
              platesLength: jsonData.plates?.length || 0,
              hasDetails: !!jsonData.details,
              detailsLength: jsonData.details?.length || 0,
              keys: Object.keys(jsonData)
            });
          }
          
          // Lấy image từ JSON (có thể là base64 hoặc URL)
          if (jsonData.image) {
            // Nếu là base64 string
            if (typeof jsonData.image === "string" && jsonData.image.startsWith("data:image")) {
              const base64Data = jsonData.image.split(",")[1] || jsonData.image;
              imageBuffer = Buffer.from(base64Data, "base64");
              finalContentType = jsonData.image.split(";")[0].replace("data:", "") || "image/png";
            } else if (typeof jsonData.image === "string") {
              // Nếu là base64 không có prefix
              imageBuffer = Buffer.from(jsonData.image, "base64");
              finalContentType = jsonData.content_type || jsonData.contentType || "image/png";
            } else {
              // Fallback: tạo empty image
              imageBuffer = Buffer.from([]);
              finalContentType = "image/png";
            }
          } else if (jsonData.annotated_image) {
            // Thử field annotated_image
            const annotatedImage = jsonData.annotated_image;
            if (typeof annotatedImage === "string" && annotatedImage.startsWith("data:image")) {
              const base64Data = annotatedImage.split(",")[1] || annotatedImage;
              imageBuffer = Buffer.from(base64Data, "base64");
              finalContentType = annotatedImage.split(";")[0].replace("data:", "") || "image/png";
            } else if (typeof annotatedImage === "string") {
              imageBuffer = Buffer.from(annotatedImage, "base64");
              finalContentType = jsonData.content_type || jsonData.contentType || "image/png";
            } else {
              imageBuffer = Buffer.from([]);
              finalContentType = "image/png";
            }
          } else {
            // Không có image trong JSON, tạo empty image
            console.warn(`[FastAPI Service] No image found in JSON response`);
            imageBuffer = Buffer.from([]);
            finalContentType = "image/png";
          }
          
          if (licensePlate) {
            console.log(`[FastAPI Service] Found license plate in JSON body: ${licensePlate}`);
          }
        } catch (parseError: any) {
          console.error(`[FastAPI Service] Error parsing JSON response:`, parseError.message);
          // Fallback: treat as binary
          imageBuffer = Buffer.from(response.data as ArrayBuffer);
          finalContentType = "image/png";
        }
      } else {
        // FastAPI trả về binary image - lấy license plate từ header
        console.log(`[FastAPI Service] FastAPI returned binary image, checking headers...`);
        imageBuffer = Buffer.from(response.data as ArrayBuffer);
        finalContentType = contentType || "image/png";
        
        // Thử các header names phổ biến
        const possibleHeaders = [
          "x-license-plate",
          "license-plate",
          "x-detected-license-plate",
          "detected-license-plate",
          "x-licenseplate",
          "licenseplate"
        ];
        
        for (const headerName of possibleHeaders) {
          const headerValue = response.headers[headerName];
          if (headerValue) {
            // Xử lý nếu là array
            if (Array.isArray(headerValue)) {
              licensePlate = headerValue[0] || null;
            } else if (typeof headerValue === "string") {
              licensePlate = headerValue.trim();
            } else {
              licensePlate = String(headerValue).trim();
            }
            
            // Validate và clean
            if (licensePlate && 
                licensePlate !== "" && 
                licensePlate.toLowerCase() !== "null" && 
                licensePlate.toLowerCase() !== "none" &&
                licensePlate !== "undefined" &&
                licensePlate !== "N/A") {
              console.log(`[FastAPI Service] Found license plate in header "${headerName}": ${licensePlate}`);
              break;
            } else {
              licensePlate = null;
            }
          }
        }
      }

      if (!licensePlate) {
        console.warn(`[FastAPI Service] No license plate detected`);
        if (isJsonResponse) {
          console.warn(`[FastAPI Service] Checked JSON body but no license plate field found`);
        } else {
          console.warn(`[FastAPI Service] Checked response headers but no license plate header found`);
          console.warn(`[FastAPI Service] Available headers:`, Object.keys(response.headers));
        }
      } else {
        console.log(`[FastAPI Service] Detected license plate: ${licensePlate}`);
      }

      return {
        image: imageBuffer,
        contentType: finalContentType,
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

