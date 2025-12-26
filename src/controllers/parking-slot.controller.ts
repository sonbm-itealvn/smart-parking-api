import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { ParkingSlot } from "../entity/ParkingSlot";

export class ParkingSlotController {
  static async create(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingSlot);
      const parkingSlot = repo.create(req.body);
      const savedParkingSlot = await repo.save(parkingSlot);
      return res.status(201).json(savedParkingSlot);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingSlot);
      const parkingLotId = req.query.parkingLotId 
        ? parseInt(req.query.parkingLotId as string) 
        : undefined;

      const where: any = {};
      if (parkingLotId) {
        where.parkingLotId = parkingLotId;
      }

      const parkingSlots = await repo.find({
        where,
        relations: ["parkingLot", "parkingSessions"],
        order: { id: "ASC" },
      });
      return res.json(parkingSlots);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingSlot);
      const parkingSlot = await repo.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ["parkingLot", "parkingSessions"],
      });

      if (!parkingSlot) {
        return res.status(404).json({ error: "Parking slot not found" });
      }

      return res.json(parkingSlot);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingSlot);
      const parkingSlot = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!parkingSlot) {
        return res.status(404).json({ error: "Parking slot not found" });
      }

      repo.merge(parkingSlot, req.body);
      const updatedParkingSlot = await repo.save(parkingSlot);
      return res.json(updatedParkingSlot);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingSlot);
      const parkingSlot = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!parkingSlot) {
        return res.status(404).json({ error: "Parking slot not found" });
      }

      await repo.remove(parkingSlot);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

