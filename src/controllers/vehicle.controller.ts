import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Vehicle } from "../entity/Vehicle";

export class VehicleController {
  static async create(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Vehicle);
      const vehicle = repo.create(req.body);
      const savedVehicle = await repo.save(vehicle);
      return res.status(201).json(savedVehicle);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Vehicle);
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

