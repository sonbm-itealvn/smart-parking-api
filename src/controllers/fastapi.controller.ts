import { Request, Response } from "express";
import { fastAPIService } from "../services/fastapi.service";

export class FastAPIController {
  /**
   * POST /api/parking-space/recommend
   * Upload image hoặc video để nhận annotated PNG với slot trống gần nhất
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

      const result = await fastAPIService.recommendParkingSpace(
        file.buffer,
        file.originalname,
        parkingLotId
      );

      res.setHeader("Content-Type", result.contentType);
      return res.send(result.image);
    } catch (error: any) {
      console.error("Error in recommendParkingSpace:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/parking-space/recommend-video
   * Upload video form-data để nhận annotated PNG với slot trống gần nhất
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

      const result = await fastAPIService.recommendParkingSpaceVideo(
        file.buffer,
        file.originalname,
        parkingLotId
      );

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

