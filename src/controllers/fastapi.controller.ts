import { Request, Response } from "express";
import { fastAPIService } from "../services/fastapi.service";
import { AppDataSource } from "../config/database";
import { ParkingSlot, ParkingSlotStatus } from "../entity/ParkingSlot";
import * as turf from "@turf/turf";

export class FastAPIController {
  /**
   * POST /api/parking-space/recommend
   * Upload image hoặc video để nhận annotated PNG với slot trống gần nhất
   * So khớp tọa độ xe với tọa độ slot bằng polygon intersection để xác định slot trống
   */
  static async recommendParkingSpace(req: Request, res: Response) {
    try {
      // Lấy file từ req.files (vì dùng upload.fields)
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const file = files?.file?.[0] || files?.image?.[0] || files?.video?.[0];
      
      if (!file) {
        return res.status(400).json({ error: "File is required" });
      }

      const parkingLotId = req.body.parkingLotId 
        ? parseInt(req.body.parkingLotId) 
        : undefined;

      // Lấy annotated image từ recommendParkingSpace
      const result = await fastAPIService.recommendParkingSpace(
        file.buffer,
        file.originalname,
        parkingLotId
      );

      // Gọi FastAPI để detect xe và lấy tọa độ (nếu có endpoint)
      // So khớp tọa độ xe với tọa độ slot
      if (parkingLotId) {
        try {
          const detectionResult = await fastAPIService.detectVehicles(
            file.buffer,
            file.originalname,
            parkingLotId
          );

          if (detectionResult.vehicles && detectionResult.vehicles.length > 0) {
            await FastAPIController.matchVehiclesToSlots(detectionResult.vehicles, parkingLotId);
          }
        } catch (error: any) {
          // Nếu endpoint detectVehicles chưa có hoặc lỗi, chỉ log warning và tiếp tục
          console.warn("Vehicle detection endpoint not available or error:", error.message);
        }
      }

      res.setHeader("Content-Type", result.contentType);
      return res.send(result.image);
    } catch (error: any) {
      console.error("Error in recommendParkingSpace:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * So khớp tọa độ xe với tọa độ slot bằng polygon intersection
   * @param vehicles Danh sách xe với tọa độ polygon
   * @param parkingLotId ID của bãi đỗ xe
   */
  private static async matchVehiclesToSlots(
    vehicles: Array<{ coordinates: number[][][] }>,
    parkingLotId: number
  ) {
    try {
      const slotRepo = AppDataSource.getRepository(ParkingSlot);
      
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
              
              // Nếu intersection area > 50% diện tích slot, coi như slot đang occupied
              const overlapRatio = intersectionArea / slotArea;
              
              if (overlapRatio > 0.5) {
                occupiedSlotIds.add(slot.id);
              }
            }
          } catch (e) {
            // Nếu không có intersection hoặc lỗi, bỏ qua
            console.warn(`Error calculating intersection for slot ${slot.id}:`, e);
          }
        }
      }

      // Cập nhật status của các slot
      for (const slot of slots) {
        const shouldBeOccupied = occupiedSlotIds.has(slot.id);
        const currentStatus = slot.status;

        if (shouldBeOccupied && currentStatus === ParkingSlotStatus.AVAILABLE) {
          slot.status = ParkingSlotStatus.OCCUPIED;
          await slotRepo.save(slot);
        } else if (!shouldBeOccupied && currentStatus === ParkingSlotStatus.OCCUPIED) {
          // Chỉ cập nhật nếu không có active session
          const hasActiveSession = slot.parkingSessions?.some(
            (session) => session.status === "active"
          );
          if (!hasActiveSession) {
            slot.status = ParkingSlotStatus.AVAILABLE;
            await slotRepo.save(slot);
          }
        }
      }
    } catch (error: any) {
      console.error("Error matching vehicles to slots:", error);
      throw error;
    }
  }

  /**
   * POST /api/parking-space/recommend-video
   * Upload video form-data để nhận annotated PNG với slot trống gần nhất
   * So khớp tọa độ xe với tọa độ slot bằng polygon intersection để xác định slot trống
   */
  static async recommendParkingSpaceVideo(req: Request, res: Response) {
    try {
      // Lấy file từ req.files (vì dùng upload.fields)
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const file = files?.video?.[0] || files?.file?.[0];
      
      if (!file) {
        return res.status(400).json({ error: "Video file is required" });
      }

      const parkingLotId = req.body.parkingLotId 
        ? parseInt(req.body.parkingLotId) 
        : undefined;

      // Lấy annotated image từ recommendParkingSpaceVideo
      const result = await fastAPIService.recommendParkingSpaceVideo(
        file.buffer,
        file.originalname,
        parkingLotId
      );

      // Gọi FastAPI để detect xe và lấy tọa độ (nếu có endpoint)
      // So khớp tọa độ xe với tọa độ slot
      if (parkingLotId) {
        try {
          const detectionResult = await fastAPIService.detectVehicles(
            file.buffer,
            file.originalname,
            parkingLotId
          );

          if (detectionResult.vehicles && detectionResult.vehicles.length > 0) {
            await FastAPIController.matchVehiclesToSlots(detectionResult.vehicles, parkingLotId);
          }
        } catch (error: any) {
          // Nếu endpoint detectVehicles chưa có hoặc lỗi, chỉ log warning và tiếp tục
          console.warn("Vehicle detection endpoint not available or error:", error.message);
        }
      }

      res.setHeader("Content-Type", result.contentType);
      return res.send(result.image);
    } catch (error: any) {
      console.error("Error in recommendParkingSpaceVideo:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/parking-space/annotate-video
   * Upload video để nhận MP4 với mọi frame được annotate
   */
  static async annotateVideo(req: Request, res: Response) {
    try {
      // Lấy file từ req.files (vì dùng upload.fields)
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const file = files?.video?.[0] || files?.file?.[0];
      
      if (!file) {
        return res.status(400).json({ error: "Video file is required" });
      }

      const parkingLotId = req.body.parkingLotId 
        ? parseInt(req.body.parkingLotId) 
        : undefined;

      const result = await fastAPIService.annotateVideo(
        file.buffer,
        file.originalname,
        parkingLotId
      );

      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="annotated-${file.originalname}"`);
      return res.send(result.video);
    } catch (error: any) {
      console.error("Error in annotateVideo:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/license-plate/detect
   * Upload image để nhận annotated PNG và biển số (qua response header)
   */
  static async detectLicensePlate(req: Request, res: Response) {
    try {
      // Lấy file từ req.files (vì dùng upload.fields)
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const file = files?.image?.[0] || files?.file?.[0];
      
      if (!file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      const result = await fastAPIService.detectLicensePlate(
        file.buffer,
        file.originalname
      );

      res.setHeader("Content-Type", result.contentType);
      if (result.licensePlate) {
        res.setHeader("X-License-Plate", result.licensePlate);
      }
      return res.send(result.image);
    } catch (error: any) {
      console.error("Error in detectLicensePlate:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/license-plate/logs
   * Lấy tất cả logged license plates
   */
  static async getLicensePlateLogs(req: Request, res: Response) {
    try {
      const logs = await fastAPIService.getLicensePlateLogs();
      return res.json(logs);
    } catch (error: any) {
      console.error("Error in getLicensePlateLogs:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}

