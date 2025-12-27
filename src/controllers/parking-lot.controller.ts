import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { ParkingLot } from "../entity/ParkingLot";
import { ParkingSession, ParkingSessionStatus } from "../entity/ParkingSession";

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

      await repo.softDelete(parkingLot.id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/parking-lots/:id/vehicles
   * Lấy danh sách xe trong bãi đỗ xe (tất cả status)
   */
  static async getVehiclesByParkingLot(req: Request, res: Response) {
    try {
      const parkingLotId = parseInt(req.params.id);

      if (isNaN(parkingLotId)) {
        return res.status(400).json({ error: "Invalid parking lot ID" });
      }

      // Kiểm tra bãi đỗ xe có tồn tại không
      const parkingLotRepo = AppDataSource.getRepository(ParkingLot);
      const parkingLot = await parkingLotRepo.findOne({
        where: { id: parkingLotId },
      });

      if (!parkingLot) {
        return res.status(404).json({ error: "Parking lot not found" });
      }

      // Lấy tất cả parking sessions trong bãi đỗ xe (tất cả status)
      // Query: ParkingSession -> ParkingSlot (có parkingLotId) -> filter theo parkingLotId
      const sessionRepo = AppDataSource.getRepository(ParkingSession);
      const sessionsInLot = await sessionRepo
        .createQueryBuilder("session")
        .innerJoin("session.parkingSlot", "parkingSlot")
        .leftJoinAndSelect("session.vehicle", "vehicle")
        .leftJoinAndSelect("vehicle.user", "user")
        .leftJoinAndSelect("session.parkingSlot", "parkingSlotData")
        .where("parkingSlot.parkingLotId = :parkingLotId", { parkingLotId })
        .orderBy("session.entryTime", "DESC")
        .getMany();

      // Format response để trả về thông tin xe
      const vehicles = sessionsInLot.map(session => ({
        sessionId: session.id,
        licensePlate: session.vehicle?.licensePlate || session.licensePlate,
        vehicleType: session.vehicle?.vehicleType || null,
        isRegistered: !!session.vehicle,
        status: session.status,
        vehicle: session.vehicle ? {
          id: session.vehicle.id,
          licensePlate: session.vehicle.licensePlate,
          vehicleType: session.vehicle.vehicleType,
          userId: session.vehicle.userId,
          user: session.vehicle.user ? {
            id: session.vehicle.user.id,
            fullName: session.vehicle.user.fullName,
            email: session.vehicle.user.email,
          } : null,
        } : null,
        parkingSlot: {
          id: session.parkingSlot.id,
          slotCode: session.parkingSlot.slotCode,
          status: session.parkingSlot.status,
        },
        entryTime: session.entryTime,
        exitTime: session.exitTime,
        fee: session.fee,
      }));

      return res.json({
        parkingLot: {
          id: parkingLot.id,
          name: parkingLot.name,
          address: parkingLot.address,
        },
        totalVehicles: vehicles.length,
        vehicles: vehicles,
      });
    } catch (error: any) {
      console.error("Error in getVehiclesByParkingLot:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}

