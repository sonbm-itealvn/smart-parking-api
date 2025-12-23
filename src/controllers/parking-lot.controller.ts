import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { ParkingLot } from "../entity/ParkingLot";

export class ParkingLotController {
  static async create(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingLot);
      const parkingLot = repo.create(req.body);
      const savedParkingLot = await repo.save(parkingLot);
      return res.status(201).json(savedParkingLot);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingLot);
      const parkingLots = await repo.find({
        relations: ["parkingSlots"],
      });
      return res.json(parkingLots);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingLot);
      const parkingLot = await repo.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ["parkingSlots"],
      });

      if (!parkingLot) {
        return res.status(404).json({ error: "Parking lot not found" });
      }

      return res.json(parkingLot);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingLot);
      const parkingLot = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!parkingLot) {
        return res.status(404).json({ error: "Parking lot not found" });
      }

      repo.merge(parkingLot, req.body);
      const updatedParkingLot = await repo.save(parkingLot);
      return res.json(updatedParkingLot);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingLot);
      const parkingLot = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!parkingLot) {
        return res.status(404).json({ error: "Parking lot not found" });
      }

      await repo.remove(parkingLot);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

