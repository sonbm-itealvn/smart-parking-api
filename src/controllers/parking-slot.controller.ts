import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { ParkingSlot } from "../entity/ParkingSlot";
import { ParkingSession, ParkingSessionStatus } from "../entity/ParkingSession";

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

      await repo.softDelete(parkingSlot.id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Lấy thông tin người đang đỗ tại vị trí này
   * @param req Request với slot id trong params
   * @param res Response
   */
  static async getCurrentOccupant(req: Request, res: Response) {
    try {
      const slotId = parseInt(req.params.id);
      const slotRepo = AppDataSource.getRepository(ParkingSlot);
      const sessionRepo = AppDataSource.getRepository(ParkingSession);

      // Kiểm tra slot có tồn tại không
      const parkingSlot = await slotRepo.findOne({
        where: { id: slotId },
        relations: ["parkingLot"],
      });

      if (!parkingSlot) {
        return res.status(404).json({ error: "Parking slot not found" });
      }

      // Tìm session đang active tại slot này
      const activeSession = await sessionRepo.findOne({
        where: {
          parkingSlotId: slotId,
          status: ParkingSessionStatus.ACTIVE,
        },
        relations: [
          "vehicle",
          "vehicle.user",
          "parkingSlot",
          "parkingSlot.parkingLot",
        ],
        order: {
          entryTime: "DESC",
        },
      });

      if (!activeSession) {
        return res.json({
          parkingSlot: {
            id: parkingSlot.id,
            slotCode: parkingSlot.slotCode,
            status: parkingSlot.status,
          },
          isOccupied: false,
          currentOccupant: null,
        });
      }

      // Trả về thông tin người đang đỗ
      return res.json({
        parkingSlot: {
          id: parkingSlot.id,
          slotCode: parkingSlot.slotCode,
          status: parkingSlot.status,
        },
        isOccupied: true,
        currentOccupant: {
          session: {
            id: activeSession.id,
            entryTime: activeSession.entryTime,
            licensePlate: activeSession.licensePlate,
          },
          vehicle: activeSession.vehicle
            ? {
                id: activeSession.vehicle.id,
                licensePlate: activeSession.vehicle.licensePlate,
                vehicleType: activeSession.vehicle.vehicleType,
              }
            : null,
          user: activeSession.vehicle?.user
            ? {
                id: activeSession.vehicle.user.id,
                fullName: activeSession.vehicle.user.fullName,
                email: activeSession.vehicle.user.email,
              }
            : null,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

