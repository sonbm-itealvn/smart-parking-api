import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entity/User";

export class UserController {
  static async create(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(User);
      const user = repo.create(req.body);
      const savedUser = await repo.save(user);
      return res.status(201).json(savedUser);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(User);
      const users = await repo.find({
        relations: ["role", "vehicles", "notifications"],
      });
      return res.json(users);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(User);
      const user = await repo.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ["role", "vehicles", "notifications"],
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json(user);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(User);
      const user = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      repo.merge(user, req.body);
      const updatedUser = await repo.save(user);
      return res.json(updatedUser);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(User);
      const user = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await repo.remove(user);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Đăng ký device token để nhận push notification
   */
  static async registerDeviceToken(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(User);
      
      // Get userId from authenticated user
      const authReq = req as any;
      const userId = authReq.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { deviceToken } = req.body;

      if (!deviceToken || typeof deviceToken !== "string") {
        return res.status(400).json({ error: "deviceToken is required and must be a string" });
      }

      const user = await repo.findOne({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update device token
      user.deviceToken = deviceToken;
      await repo.save(user);

      return res.json({
        message: "Device token registered successfully",
        userId: user.id,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
