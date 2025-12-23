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

      await repo.remove(notification);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

