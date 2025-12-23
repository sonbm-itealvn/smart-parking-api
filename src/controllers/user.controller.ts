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
}
