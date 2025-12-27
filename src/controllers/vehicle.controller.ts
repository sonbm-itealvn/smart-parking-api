import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Vehicle } from "../entity/Vehicle";

export class VehicleController {
  static async create(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Vehicle);
      
      // Get userId from authenticated user
      const authReq = req as any;
      const userId = authReq.user?.userId;
      const userRoleId = authReq.user?.roleId;
      const isAdmin = userRoleId === 2; // Admin has roleId = 2

      // Validate authentication
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Validate required fields
      const { licensePlate, vehicleType } = req.body;
      if (!licensePlate || !vehicleType) {
        return res.status(400).json({ 
          error: "licensePlate and vehicleType are required" 
        });
      }

      // Validate vehicleType
      const validVehicleTypes = ["car", "motorcycle", "truck"];
      if (!validVehicleTypes.includes(vehicleType)) {
        return res.status(400).json({ 
          error: `vehicleType must be one of: ${validVehicleTypes.join(", ")}` 
        });
      }

      // Nếu user không phải admin, tự động gán userId từ token
      // Admin có thể tạo vehicle cho user khác bằng cách gửi userId trong body
      if (!isAdmin) {
        req.body.userId = userId;
      } else {
        // Admin có thể set userId, nhưng nếu không có thì dùng userId của admin
        req.body.userId = req.body.userId || userId;
      }

      // Validate userId exists
      if (!req.body.userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      // Check if license plate already exists for this user
      const existingVehicle = await repo.findOne({
        where: { 
          licensePlate: licensePlate,
          userId: req.body.userId 
        },
      });

      if (existingVehicle) {
        return res.status(409).json({ 
          error: "Vehicle with this license plate already exists for this user" 
        });
      }

      const vehicle = repo.create(req.body);
      const savedVehicle = await repo.save(vehicle);
      
      // Reload với relations
      const vehicleWithRelations = await repo.findOne({
        where: { id: savedVehicle.id },
        relations: ["user", "parkingSessions"],
      });

      return res.status(201).json(vehicleWithRelations);
    } catch (error: any) {
      console.error("Error creating vehicle:", error);
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Vehicle);
      
      // Get userId from authenticated user
      const authReq = req as any;
      const userId = authReq.user?.userId;
      const userRoleId = authReq.user?.roleId;
      const isAdmin = userRoleId === 2; // Admin has roleId = 2

      // Nếu user không phải admin, chỉ lấy vehicles của chính họ
      if (userId && !isAdmin) {
        const vehicles = await repo.find({
          where: { userId },
          relations: ["user", "parkingSessions"],
        });
        return res.json(vehicles);
      }

      // Admin lấy tất cả vehicles
      const vehicles = await repo.find({
        relations: ["user", "parkingSessions"],
      });
      return res.json(vehicles);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Vehicle);
      const vehicle = await repo.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ["user", "parkingSessions"],
      });

      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      return res.json(vehicle);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Vehicle);
      const vehicle = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      repo.merge(vehicle, req.body);
      const updatedVehicle = await repo.save(vehicle);
      return res.json(updatedVehicle);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Vehicle);
      const vehicle = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      await repo.remove(vehicle);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

