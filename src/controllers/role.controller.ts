import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Role } from "../entity/Role";

export class RoleController {
  static async create(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Role);
      const role = repo.create(req.body);
      const savedRole = await repo.save(role);
      return res.status(201).json(savedRole);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Role);
      const roles = await repo.find({
        relations: ["users"],
      });
      return res.json(roles);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Role);
      const role = await repo.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ["users"],
      });

      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }

      return res.json(role);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Role);
      const role = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }

      repo.merge(role, req.body);
      const updatedRole = await repo.save(role);
      return res.json(updatedRole);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Role);
      const role = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }

      await repo.softDelete(role.id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

