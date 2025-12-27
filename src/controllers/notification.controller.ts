import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Notification } from "../entity/Notification";

export class NotificationController {
  static async create(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Notification);
      const notification = repo.create(req.body);
      const savedNotification = await repo.save(notification);
      return res.status(201).json(savedNotification);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Notification);
      
      // Get userId from authenticated user
      const authReq = req as any;
      const userId = authReq.user?.userId;
      const userRoleId = authReq.user?.roleId;
      const isAdmin = userRoleId === 2; // Admin has roleId = 2

      // Nếu user không phải admin, chỉ lấy notifications của chính họ
      if (userId && !isAdmin) {
        const notifications = await repo.find({
          where: { userId },
          relations: ["user"],
          order: { createdAt: "DESC" },
        });
        return res.json(notifications);
      }

      // Admin lấy tất cả notifications
      const notifications = await repo.find({
        relations: ["user"],
        order: { createdAt: "DESC" },
      });
      return res.json(notifications);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Notification);
      const notification = await repo.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ["user"],
      });

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      return res.json(notification);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Notification);
      const notification = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      repo.merge(notification, req.body);
      const updatedNotification = await repo.save(notification);
      return res.json(updatedNotification);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Notification);
      const notification = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      await repo.softDelete(notification.id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

