import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { ParkingSession } from "../entity/ParkingSession";

export class ParkingSessionController {
  static async create(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingSession);
      const parkingSession = repo.create(req.body);
      const savedParkingSession = await repo.save(parkingSession);
      return res.status(201).json(savedParkingSession);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingSession);
      const parkingSessions = await repo.find({
        relations: ["vehicle", "parkingSlot", "payments"],
        order: { entryTime: "DESC" },
      });
      return res.json(parkingSessions);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingSession);
      const parkingSession = await repo.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ["vehicle", "parkingSlot", "payments"],
      });

      if (!parkingSession) {
        return res.status(404).json({ error: "Parking session not found" });
      }

      return res.json(parkingSession);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingSession);
      const parkingSession = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!parkingSession) {
        return res.status(404).json({ error: "Parking session not found" });
      }

      repo.merge(parkingSession, req.body);
      const updatedParkingSession = await repo.save(parkingSession);
      return res.json(updatedParkingSession);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingSession);
      const parkingSession = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!parkingSession) {
        return res.status(404).json({ error: "Parking session not found" });
      }

      await repo.remove(parkingSession);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

