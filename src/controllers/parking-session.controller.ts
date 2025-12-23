import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { ParkingSession, ParkingSessionStatus } from "../entity/ParkingSession";
import { ParkingSlot, ParkingSlotStatus } from "../entity/ParkingSlot";

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

      // Tính phí theo cơ chế: Giờ đầu 30,000, mỗi giờ tiếp theo tăng 10%
      const FIRST_HOUR_FEE = 30000;
      const INCREASE_RATE = 1.1; // 10% increase

      let totalFee = 0;
      let currentHourFee = FIRST_HOUR_FEE;
      const feeBreakdown: Array<{ hour: number; fee: number }> = [];

      for (let hour = 1; hour <= totalHours; hour++) {
        if (hour === 1) {
          // Giờ đầu tiên: 30,000
          currentHourFee = FIRST_HOUR_FEE;
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
          firstHourFee: FIRST_HOUR_FEE,
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

