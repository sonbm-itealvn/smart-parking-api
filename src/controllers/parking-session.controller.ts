import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { ParkingSession, ParkingSessionStatus } from "../entity/ParkingSession";
import { ParkingSlot, ParkingSlotStatus } from "../entity/ParkingSlot";

export class ParkingSessionController {
  static async create(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingSession);
      const slotRepo = AppDataSource.getRepository(ParkingSlot);
      
      const { parkingSlotId, parkingLotId } = req.body;

      // Validate parkingSlotId
      if (!parkingSlotId) {
        return res.status(400).json({ error: "parkingSlotId is required" });
      }

      // Kiểm tra slot có tồn tại không
      const slot = await slotRepo.findOne({
        where: { id: parkingSlotId },
        relations: ["parkingLot"],
      });

      if (!slot) {
        return res.status(404).json({ error: "Parking slot not found" });
      }

      // Nếu có parkingLotId, kiểm tra slot có thuộc đúng bãi đỗ không
      if (parkingLotId && slot.parkingLotId !== parkingLotId) {
        return res.status(400).json({ 
          error: `Parking slot ${parkingSlotId} does not belong to parking lot ${parkingLotId}` 
        });
      }

      // Kiểm tra slot có available không
      if (slot.status !== ParkingSlotStatus.AVAILABLE) {
        return res.status(400).json({ 
          error: `Parking slot ${parkingSlotId} is not available (status: ${slot.status})` 
        });
      }

      const parkingSession = repo.create(req.body);
      const savedParkingSession = await repo.save(parkingSession);

      // Cập nhật slot status thành occupied
      slot.status = ParkingSlotStatus.OCCUPIED;
      await slotRepo.save(slot);

      // Reload với relations
      const sessionWithRelations = await repo.findOne({
        where: { id: savedParkingSession.id },
        relations: ["vehicle", "parkingSlot", "parkingSlot.parkingLot", "payments"],
      });

      return res.status(201).json(sessionWithRelations);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ParkingSession);
      const parkingLotId = req.query.parkingLotId 
        ? parseInt(req.query.parkingLotId as string) 
        : undefined;
      const status = req.query.status as string | undefined;

      const queryBuilder = repo.createQueryBuilder("session")
        .leftJoinAndSelect("session.vehicle", "vehicle")
        .leftJoinAndSelect("session.parkingSlot", "parkingSlot")
        .leftJoinAndSelect("parkingSlot.parkingLot", "parkingLot")
        .leftJoinAndSelect("session.payments", "payments");

      // Filter theo parkingLotId nếu có
      if (parkingLotId) {
        queryBuilder.where("parkingLot.id = :parkingLotId", { parkingLotId });
      }

      // Filter theo status nếu có
      if (status) {
        if (parkingLotId) {
          queryBuilder.andWhere("session.status = :status", { status });
        } else {
          queryBuilder.where("session.status = :status", { status });
        }
      }

      queryBuilder.orderBy("session.entryTime", "DESC");

      const parkingSessions = await queryBuilder.getMany();
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

  /**
   * Tính tiền và cho xe ra khỏi bãi đỗ
   * @param req Request với sessionId trong params
   * @param res Response
   */
  static async exitVehicle(req: Request, res: Response) {
    try {
      const sessionId = parseInt(req.params.id);
      const sessionRepo = AppDataSource.getRepository(ParkingSession);
      const slotRepo = AppDataSource.getRepository(ParkingSlot);

      // Tìm parking session với relations
      const parkingSession = await sessionRepo.findOne({
        where: { id: sessionId },
        relations: ["parkingSlot", "vehicle"],
      });

      if (!parkingSession) {
        return res.status(404).json({ error: "Parking session not found" });
      }

      // Kiểm tra session đã hoàn thành chưa
      if (parkingSession.status === ParkingSessionStatus.COMPLETED) {
        return res.status(400).json({
          error: "Parking session has already been completed",
        });
      }

      // Lấy parking slot với parking lot
      const parkingSlot = await slotRepo.findOne({
        where: { id: parkingSession.parkingSlotId },
        relations: ["parkingLot"],
      });

      if (!parkingSlot) {
        return res.status(404).json({ error: "Parking slot not found" });
      }

      // Lấy giá mỗi giờ từ parking lot
      const parkingLot = parkingSlot.parkingLot;
      if (!parkingLot) {
        return res.status(404).json({ error: "Parking lot not found" });
      }

      // Lấy thời gian hiện tại làm exit time
      const exitTime = new Date();

      // Tính số giờ đỗ xe (làm tròn lên)
      const entryTime = new Date(parkingSession.entryTime);
      const durationMs = exitTime.getTime() - entryTime.getTime();
      const durationHours = Math.ceil(durationMs / (1000 * 60 * 60)); // Làm tròn lên đến giờ gần nhất
      const totalHours = durationHours < 1 ? 1 : durationHours; // Tối thiểu 1 giờ

      // Lấy giá mỗi giờ từ parking lot
      const pricePerHour = Number(parkingLot.pricePerHour);
      if (!pricePerHour || pricePerHour <= 0) {
        return res.status(400).json({
          error: "Invalid pricePerHour for parking lot",
        });
      }

      // Tính phí theo cơ chế: Giờ đầu = pricePerHour, mỗi giờ tiếp theo tăng 10%
      const INCREASE_RATE = 1.1; // 10% increase

      let totalFee = 0;
      let currentHourFee = pricePerHour;
      const feeBreakdown: Array<{ hour: number; fee: number }> = [];

      for (let hour = 1; hour <= totalHours; hour++) {
        if (hour === 1) {
          // Giờ đầu tiên: pricePerHour
          currentHourFee = pricePerHour;
        } else {
          // Các giờ tiếp theo: tăng 10%
          currentHourFee = Math.round(currentHourFee * INCREASE_RATE);
        }
        totalFee += currentHourFee;
        feeBreakdown.push({ hour, fee: currentHourFee });
      }

      // Cập nhật parking session
      parkingSession.exitTime = exitTime;
      parkingSession.fee = totalFee;
      parkingSession.status = ParkingSessionStatus.COMPLETED;
      await sessionRepo.save(parkingSession);

      // Cập nhật parking slot status thành available
      parkingSlot.status = ParkingSlotStatus.AVAILABLE;
      await slotRepo.save(parkingSlot);

      // Reload session với relations
      const updatedSession = await sessionRepo.findOne({
        where: { id: sessionId },
        relations: ["vehicle", "parkingSlot", "parkingSlot.parkingLot", "payments"],
      });

      return res.json({
        message: "Vehicle exited successfully",
        parkingSession: updatedSession,
        feeDetails: {
          entryTime: entryTime,
          exitTime: exitTime,
          durationHours: totalHours,
          pricePerHour: pricePerHour,
          firstHourFee: pricePerHour,
          increaseRate: "10%",
          feeBreakdown: feeBreakdown,
          totalFee: totalFee,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

