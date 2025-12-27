import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Camera } from "../entity/Camera";
import { Vehicle } from "../entity/Vehicle";
import { ParkingSession, ParkingSessionStatus } from "../entity/ParkingSession";
import { ParkingSlot } from "../entity/ParkingSlot";
import axios from "axios";
import { fastAPIService } from "../services/fastapi.service";
import { VehicleDetectionController } from "./vehicle-detection.controller";
import * as turf from "@turf/turf";

export class CameraController {
  /**
   * GET /api/cameras
   * Lấy tất cả camera hoặc filter theo parkingLotId
   */
  static async getAll(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Camera);
      const parkingLotId = req.query.parkingLotId 
        ? parseInt(req.query.parkingLotId as string) 
        : undefined;

      const where: any = {};
      if (parkingLotId) {
        where.parkingLotId = parkingLotId;
      }

      const cameras = await repo.find({
        where,
        relations: ["parkingLot"],
        order: { id: "ASC" },
      });

      return res.json(cameras);
    } catch (error: any) {
      console.error("Error in getAll cameras:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/cameras/:id
   * Lấy thông tin camera theo ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid camera ID" });
      }

      const repo = AppDataSource.getRepository(Camera);
      const camera = await repo.findOne({
        where: { id },
        relations: ["parkingLot"],
      });

      if (!camera) {
        return res.status(404).json({ error: "Camera not found" });
      }

      return res.json(camera);
    } catch (error: any) {
      console.error("Error in getById camera:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/cameras/:id/stream
   * Lấy stream URL của camera để truyền vào FastAPI endpoints
   */
  static async getStreamUrl(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid camera ID" });
      }

      const repo = AppDataSource.getRepository(Camera);
      const camera = await repo.findOne({
        where: { id },
        relations: ["parkingLot"],
      });

      if (!camera) {
        return res.status(404).json({ error: "Camera not found" });
      }

      if (camera.status !== "active") {
        return res.status(400).json({ 
          error: `Camera is not active (status: ${camera.status})` 
        });
      }

      // Trả về stream URL và metadata để FE có thể sử dụng
      return res.json({
        cameraId: camera.id,
        cameraName: camera.name,
        streamUrl: camera.streamUrl,
        cameraType: camera.cameraType,
        parkingLotId: camera.parkingLotId,
        parkingLotName: camera.parkingLot?.name || null,
        // Hướng dẫn sử dụng
        usage: {
          fastapiEndpoints: {
            recommendParkingSpace: {
              method: "POST",
              url: "/api/parking-space/recommend",
              note: "Upload video từ stream này hoặc sử dụng streamUrl trực tiếp nếu FastAPI hỗ trợ",
            },
            recommendParkingSpaceVideo: {
              method: "POST",
              url: "/api/parking-space/recommend-video",
              note: "Upload video từ stream này",
            },
            detectLicensePlate: {
              method: "POST",
              url: "/api/license-plate/detect",
              note: "Upload frame/image từ stream này",
            },
          },
        },
      });
    } catch (error: any) {
      console.error("Error in getStreamUrl:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/cameras
   * Tạo camera mới (Admin only)
   */
  static async create(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Camera);
      const camera = repo.create(req.body);
      const savedCamera = await repo.save(camera);
      
      // Đảm bảo savedCamera là một object, không phải array
      if (Array.isArray(savedCamera)) {
        throw new Error("Unexpected array result from save");
      }

      // Reload với relations
      const cameraWithRelations = await repo.findOne({
        where: { id: savedCamera.id },
        relations: ["parkingLot"],
      });

      return res.status(201).json(cameraWithRelations);
    } catch (error: any) {
      console.error("Error in create camera:", error);
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * PUT /api/cameras/:id
   * Cập nhật camera (Admin only)
   */
  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid camera ID" });
      }

      const repo = AppDataSource.getRepository(Camera);
      const camera = await repo.findOne({
        where: { id },
      });

      if (!camera) {
        return res.status(404).json({ error: "Camera not found" });
      }

      repo.merge(camera, req.body);
      const updatedCamera = await repo.save(camera);
      
      // Đảm bảo updatedCamera là một object, không phải array
      if (Array.isArray(updatedCamera)) {
        throw new Error("Unexpected array result from save");
      }

      // Reload với relations
      const cameraWithRelations = await repo.findOne({
        where: { id: updatedCamera.id },
        relations: ["parkingLot"],
      });

      return res.json(cameraWithRelations);
    } catch (error: any) {
      console.error("Error in update camera:", error);
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/cameras/:id
   * Xóa camera (Admin only)
   */
  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid camera ID" });
      }

      const repo = AppDataSource.getRepository(Camera);
      const camera = await repo.findOne({
        where: { id },
      });

      if (!camera) {
        return res.status(404).json({ error: "Camera not found" });
      }

      await repo.softDelete(camera.id);
      return res.status(204).send();
    } catch (error: any) {
      console.error("Error in delete camera:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/cameras/:id/detect-license-plate
   * Lấy frame từ camera stream và gọi FastAPI để detect biển số xe
   */
  static async detectLicensePlateFromCamera(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid camera ID" });
      }

      const repo = AppDataSource.getRepository(Camera);
      const camera = await repo.findOne({
        where: { id },
        relations: ["parkingLot"],
      });

      if (!camera) {
        return res.status(404).json({ error: "Camera not found" });
      }

      if (camera.status !== "active") {
        return res.status(400).json({ 
          error: `Camera is not active (status: ${camera.status})` 
        });
      }

      // Fetch frame/image từ camera stream
      let imageBuffer: Buffer;
      try {
        // Nếu là HTTP URL, fetch trực tiếp
        if (camera.cameraType === "http" || camera.streamUrl.startsWith("http")) {
          const response = await axios.get(camera.streamUrl, {
            responseType: "arraybuffer",
            timeout: 10000, // 10 seconds timeout
          });
          imageBuffer = Buffer.from(response.data);
        } else {
          // RTSP hoặc webcam - yêu cầu user cung cấp HTTP snapshot URL hoặc xử lý khác
          return res.status(400).json({ 
            error: `Camera type ${camera.cameraType} requires HTTP snapshot URL. Please use HTTP camera or provide snapshot URL.` 
          });
        }
      } catch (error: any) {
        console.error("Error fetching frame from camera:", error.message);
        return res.status(500).json({ 
          error: `Failed to fetch frame from camera: ${error.message}` 
        });
      }

      // Gọi FastAPI để detect license plate
      const result = await fastAPIService.detectLicensePlate(
        imageBuffer,
        `camera-${camera.id}-frame.jpg`
      );

      res.setHeader("Content-Type", result.contentType);
      if (result.licensePlate) {
        res.setHeader("X-License-Plate", result.licensePlate);
      }
      return res.send(result.image);
    } catch (error: any) {
      console.error("Error in detectLicensePlateFromCamera:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/cameras/:id/detect-parking-space
   * Lấy video từ camera stream và gọi FastAPI để nhận diện xe và check vị trí trống
   */
  static async detectParkingSpaceFromCamera(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid camera ID" });
      }

      const repo = AppDataSource.getRepository(Camera);
      const camera = await repo.findOne({
        where: { id },
        relations: ["parkingLot"],
      });

      if (!camera) {
        return res.status(404).json({ error: "Camera not found" });
      }

      if (camera.status !== "active") {
        return res.status(400).json({ 
          error: `Camera is not active (status: ${camera.status})` 
        });
      }

      // Lấy parkingLotId từ camera hoặc từ request body
      const parkingLotId = camera.parkingLotId 
        ? camera.parkingLotId 
        : (req.body.parkingLotId ? parseInt(req.body.parkingLotId) : undefined);

      if (!parkingLotId) {
        return res.status(400).json({ 
          error: "parkingLotId is required. Either set it in camera or provide in request body." 
        });
      }

      // Fetch video từ camera stream
      let videoBuffer: Buffer;
      try {
        // Nếu là HTTP URL, fetch trực tiếp
        if (camera.cameraType === "http" || camera.streamUrl.startsWith("http")) {
          const response = await axios.get(camera.streamUrl, {
            responseType: "arraybuffer",
            timeout: 30000, // 30 seconds timeout cho video
          });
          videoBuffer = Buffer.from(response.data);
        } else {
          // RTSP hoặc webcam - yêu cầu user cung cấp HTTP video URL hoặc xử lý khác
          return res.status(400).json({ 
            error: `Camera type ${camera.cameraType} requires HTTP video URL. Please use HTTP camera or provide video URL.` 
          });
        }
      } catch (error: any) {
        console.error("Error fetching video from camera:", error.message);
        return res.status(500).json({ 
          error: `Failed to fetch video from camera: ${error.message}` 
        });
      }

      // Gọi FastAPI để recommend parking space
      const result = await fastAPIService.recommendParkingSpaceVideo(
        videoBuffer,
        `camera-${camera.id}-video.mp4`,
        parkingLotId
      );

      // Gọi FastAPI để detect xe và lấy tọa độ (nếu có endpoint)
      // So khớp tọa độ xe với tọa độ slot
      if (parkingLotId) {
        try {
          const detectionResult = await fastAPIService.detectVehicles(
            videoBuffer,
            `camera-${camera.id}-video.mp4`,
            parkingLotId
          );

          if (detectionResult.vehicles && detectionResult.vehicles.length > 0) {
            await CameraController.matchVehiclesToSlots(detectionResult.vehicles, parkingLotId);
          }
        } catch (error: any) {
          // Nếu endpoint detectVehicles chưa có hoặc lỗi, chỉ log warning và tiếp tục
          console.warn("Vehicle detection endpoint not available or error:", error.message);
        }
      }

      res.setHeader("Content-Type", result.contentType);
      return res.send(result.image);
    } catch (error: any) {
      console.error("Error in detectParkingSpaceFromCamera:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Helper method để so khớp tọa độ xe với tọa độ slot
   */
  private static async matchVehiclesToSlots(
    vehicles: Array<{ coordinates: number[][][] }>,
    parkingLotId: number
  ) {
    try {
      const slotRepo = AppDataSource.getRepository(ParkingSlot);
      const { ParkingSlotStatus } = await import("../entity/ParkingSlot");
      
      // Lấy tất cả slots của bãi đỗ xe có coordinates
      const allSlots = await slotRepo.find({
        where: {
          parkingLotId: parkingLotId,
        },
        relations: ["parkingSessions"],
      });

      // Lọc chỉ lấy slots có coordinates
      const slots = allSlots.filter(slot => slot.coordinates && slot.coordinates.length > 0);

      // Tạo map để track slot nào đang occupied
      const occupiedSlotIds = new Set<number>();

      // So khớp từng xe với từng slot
      for (const vehicle of vehicles) {
        if (!vehicle.coordinates || vehicle.coordinates.length === 0) continue;

        // Tạo GeoJSON polygon từ tọa độ xe
        // Format: [[[x1,y1], [x2,y2], [x3,y3], [x4,y4], [x1,y1]]]
        const vehiclePolygon = vehicle.coordinates[0]; // Lấy polygon đầu tiên
        if (vehiclePolygon.length < 3) continue; // Cần ít nhất 3 điểm để tạo polygon

        // Chuyển đổi sang GeoJSON format cho turf.js
        const vehicleGeoJSON = turf.polygon([vehiclePolygon]);

        for (const slot of slots) {
          if (!slot.coordinates || slot.coordinates.length === 0) continue;

          // Tạo GeoJSON polygon từ tọa độ slot
          const slotPolygon = slot.coordinates[0];
          if (slotPolygon.length < 3) continue;

          const slotGeoJSON = turf.polygon([slotPolygon]);

          // Tính intersection area
          try {
            const intersection = turf.intersect(vehicleGeoJSON, slotGeoJSON);
            
            if (intersection) {
              // Tính diện tích intersection và diện tích slot
              const intersectionArea = turf.area(intersection);
              const slotArea = turf.area(slotGeoJSON);
              
              // Nếu intersection area > 50% diện tích slot, đánh dấu slot là OCCUPIED
              const intersectionRatio = intersectionArea / slotArea;
              if (intersectionRatio > 0.5) {
                occupiedSlotIds.add(slot.id);
              }
            }
          } catch (error: any) {
            console.warn(`Error calculating intersection for slot ${slot.id}:`, error.message);
          }
        }
      }

      // Cập nhật trạng thái slot
      for (const slot of slots) {
        if (occupiedSlotIds.has(slot.id)) {
          if (slot.status !== ParkingSlotStatus.OCCUPIED) {
            slot.status = ParkingSlotStatus.OCCUPIED;
            await slotRepo.save(slot);
          }
        } else {
          // Nếu slot không có xe nào overlap, đánh dấu là AVAILABLE
          // (trừ khi slot đang có active session)
          const hasActiveSession = slot.parkingSessions?.some(
            session => !session.exitTime
          );
          
          if (!hasActiveSession && slot.status !== ParkingSlotStatus.AVAILABLE) {
            slot.status = ParkingSlotStatus.AVAILABLE;
            await slotRepo.save(slot);
          }
        }
      }
    } catch (error: any) {
      console.error("Error in matchVehiclesToSlots:", error);
      throw error;
    }
  }

  /**
   * POST /api/cameras/:id/process-vehicle
   * Detect biển số từ camera và tự động quyết định RA/VÀO
   * Luồng: Camera FE → Detect biển số → Backend tự động quyết định RA/VÀO → DB
   * Logic: 
   * - Nếu KHÔNG có bản ghi IN (active session) → tự động tạo bản ghi VÀO
   * - Nếu ĐÃ CÓ bản ghi IN (active session) → tự động đánh dấu RA + tính tiền
   */
  static async processVehicleFromCamera(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { parkingLotId, slotId, imageUrl: imageUrlFromBody, imageBase64 } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid camera ID" });
      }

      // Lấy thông tin camera
      const repo = AppDataSource.getRepository(Camera);
      const camera = await repo.findOne({
        where: { id },
        relations: ["parkingLot"],
      });

      if (!camera) {
        return res.status(404).json({ error: "Camera not found" });
      }

      if (camera.status !== "active") {
        return res.status(400).json({ 
          error: `Camera is not active (status: ${camera.status})` 
        });
      }

      // Lấy parkingLotId từ camera hoặc request body
      const finalParkingLotId = parkingLotId 
        ? parseInt(parkingLotId) 
        : (camera.parkingLotId || undefined);

      if (!finalParkingLotId) {
        return res.status(400).json({ 
          error: "parkingLotId is required. Either set it in camera or provide in request body." 
        });
      }

      // Bước 1: Lấy image input từ FE (ưu tiên file upload > imageUrl > imageBase64 > camera stream)
      let imageInput: string | Buffer;
      let imageUrl: string;
      let fileName = `camera-${camera.id}-frame.jpg`;
      
      // Ưu tiên 1: File upload (multipart/form-data)
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const file = files?.image?.[0] || files?.file?.[0];
      
      if (file) {
        // Có file upload, dùng buffer trực tiếp
        imageInput = file.buffer;
        fileName = file.originalname;
      }
      // Ưu tiên 2: imageUrl từ body
      else if (imageUrlFromBody && typeof imageUrlFromBody === "string") {
        // Validate URL format
        if (!imageUrlFromBody.startsWith("http://") && !imageUrlFromBody.startsWith("https://")) {
          return res.status(400).json({ 
            error: "imageUrl must be a valid HTTP/HTTPS URL" 
          });
        }
        imageUrl = imageUrlFromBody;
        imageInput = imageUrl;
      }
      // Ưu tiên 3: imageBase64 từ body
      else if (imageBase64 && typeof imageBase64 === "string") {
        try {
          // Lưu ảnh từ base64 vào disk và lấy URL
          const { ImageStorageUtil } = await import("../utils/image-storage.util");
          imageUrl = ImageStorageUtil.saveBase64Image(
            imageBase64,
            `camera-${camera.id}`
          );
          imageInput = imageUrl;
        } catch (error: any) {
          console.error("Error saving base64 image:", error.message);
          return res.status(400).json({ 
            error: `Invalid base64 image format: ${error.message}` 
          });
        }
      }
      // Ưu tiên 4: Fetch từ camera stream (cho RTSP/HTTP camera)
      else {
        try {
          if (camera.cameraType === "http" || camera.streamUrl.startsWith("http")) {
            const response = await axios.get(camera.streamUrl, {
              responseType: "arraybuffer",
              timeout: 10000,
            });
            const imageBuffer = Buffer.from(response.data);
            
            // Lưu ảnh từ stream vào disk và lấy URL
            const { ImageStorageUtil } = await import("../utils/image-storage.util");
            // Tạo base64 từ buffer để lưu
            const base64String = imageBuffer.toString("base64");
            imageUrl = ImageStorageUtil.saveBase64Image(
              `data:image/jpeg;base64,${base64String}`,
              `camera-${camera.id}`
            );
            imageInput = imageUrl;
          } else if (camera.cameraType === "webcam") {
            // Nếu là webcam nhưng không có file/imageUrl/imageBase64, yêu cầu gửi
            return res.status(400).json({ 
              error: "Webcam requires file upload, imageUrl, or imageBase64 in request body. Please provide one of them." 
            });
          } else {
            return res.status(400).json({ 
              error: `Camera type ${camera.cameraType} requires file upload, HTTP snapshot URL, imageUrl, or imageBase64 in body.` 
            });
          }
        } catch (error: any) {
          console.error("Error fetching frame from camera:", error.message);
          return res.status(500).json({ 
            error: `Failed to fetch frame from camera: ${error.message}` 
          });
        }
      }

      // Bước 2: Gọi FastAPI để detect license plate
      let licensePlate: string | null = null;
      try {
        // Gửi imageInput cho FastAPI (buffer hoặc URL)
        const result = await fastAPIService.detectLicensePlate(
          imageInput,
          fileName
        );
        
        licensePlate = result.licensePlate || null;
        
        // Nếu có imageUrl, lưu lại để trả về cho FE
        if (!imageUrl && typeof imageInput === "string") {
          imageUrl = imageInput;
        }
      } catch (error: any) {
        console.error(`[Camera ${camera.id}] Error detecting license plate:`, {
          message: error.message,
          response: error.response?.data ? Buffer.from(error.response.data).toString() : null,
          status: error.response?.status,
          imageInput: Buffer.isBuffer(imageInput) ? `Buffer(${imageInput.length} bytes)` : imageInput
        });
        
        // Kiểm tra xem có phải lỗi từ FastAPI không
        if (error.response) {
          return res.status(500).json({ 
            error: `FastAPI error: ${error.response.status} - ${error.message}`,
            details: error.response.data ? Buffer.from(error.response.data).toString() : null,
            imageUrl: imageUrl || (typeof imageInput === "string" ? imageInput : undefined)
          });
        }
        
        return res.status(500).json({ 
          error: `Failed to detect license plate: ${error.message}`,
          imageUrl: imageUrl || (typeof imageInput === "string" ? imageInput : undefined)
        });
      }

      if (!licensePlate) {
        return res.status(400).json({ 
          error: "Could not detect license plate from camera frame",
          imageUrl: imageUrl || (typeof imageInput === "string" ? imageInput : undefined),
          suggestion: "Please ensure: 1) FastAPI service is running, 2) Image contains a clear license plate, 3) Image is accessible"
        });
      }

      // Bước 3: Kiểm tra xem có active session không để tự động quyết định VÀO/RA
      // Logic này giống với logic trong VehicleDetectionController để đảm bảo nhất quán
      const vehicleRepo = AppDataSource.getRepository(Vehicle);
      const sessionRepo = AppDataSource.getRepository(ParkingSession);
      
      // Tìm vehicle trong database (có thể là xe đã đăng ký hoặc xe vãng lai)
      const vehicle = await vehicleRepo.findOne({
        where: { licensePlate },
        relations: ["user"],
      });

      // Kiểm tra active session - xử lý cả xe đã đăng ký và xe vãng lai
      // Logic này giống với VehicleDetectionController.handleVehicleEntry
      let activeSession = null;
      if (vehicle) {
        // Xe đã đăng ký: tìm session theo vehicleId
        activeSession = await sessionRepo.findOne({
          where: {
            vehicleId: vehicle.id,
            status: ParkingSessionStatus.ACTIVE,
          },
        });
      } else {
        // Xe vãng lai: tìm session theo licensePlate với vehicleId = null
        activeSession = await sessionRepo.findOne({
          where: {
            licensePlate: licensePlate,
            vehicleId: null, // Xe vãng lai không có vehicleId
            status: ParkingSessionStatus.ACTIVE,
          },
        });
      }

      // Bước 4: Tự động quyết định VÀO/RA dựa trên active session
      // Nếu KHÔNG có active session → VÀO (flag = 0)
      // Nếu CÓ active session → RA (flag = 1)
      const flag = activeSession ? 1 : 0;

      // Bước 5: Tạo request object để gọi VehicleDetectionController
      // VehicleDetectionController sẽ xử lý:
      // - Xe đã đăng ký: tạo session với vehicleId
      // - Xe vãng lai: tạo session với vehicleId = null và lưu licensePlate
      
      // Validate slotId nếu có (đảm bảo slot thuộc đúng parking lot)
      let finalSlotId: number | undefined = undefined;
      if (slotId) {
        const parsedSlotId = parseInt(slotId);
        if (!isNaN(parsedSlotId)) {
          // Kiểm tra slot có thuộc đúng parking lot không
          const slotRepo = AppDataSource.getRepository(ParkingSlot);
          const slot = await slotRepo.findOne({
            where: { 
              id: parsedSlotId,
              parkingLotId: finalParkingLotId 
            },
          });
          
          if (!slot) {
            return res.status(400).json({ 
              error: `Slot ${parsedSlotId} does not belong to parking lot ${finalParkingLotId}` 
            });
          }
          
          finalSlotId = parsedSlotId;
        }
      }
      
      const vehicleDetectionReq = {
        body: {
          licensePlate,
          flag,
          parkingLotId: finalParkingLotId,
          slotId: finalSlotId,
          image: imageUrl, // Gửi URL thay vì base64
        },
      } as Request;

      // Bước 6: Gọi VehicleDetectionController để xử lý RA/VÀO
      // Method này sẽ gọi handleVehicleEntry (xử lý cả xe vãng lai) hoặc handleVehicleExit
      // Lưu response để có thể thêm imageUrl vào
      const originalJson = res.json.bind(res);
      res.json = function(data: any) {
        // Thêm imageUrl vào response
        return originalJson({
          ...data,
          imageUrl: imageUrl, // Trả về URL của ảnh
        });
      };
      
      await VehicleDetectionController.handleVehicleDetection(vehicleDetectionReq, res);
    } catch (error: any) {
      console.error("Error in processVehicleFromCamera:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}

