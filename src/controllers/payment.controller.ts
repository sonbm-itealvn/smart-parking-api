import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Payment, PaymentStatus } from "../entity/Payment";
import { ParkingSession, ParkingSessionStatus } from "../entity/ParkingSession";

export class PaymentController {
  static async create(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Payment);
      const payment = repo.create(req.body);
      const savedPayment = await repo.save(payment);
      return res.status(201).json(savedPayment);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Payment);
      const payments = await repo.find({
        relations: ["parkingSession"],
        order: { paymentTime: "DESC" },
      });
      return res.json(payments);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Payment);
      const payment = await repo.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ["parkingSession"],
      });

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      return res.json(payment);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Payment);
      const payment = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      repo.merge(payment, req.body);
      const updatedPayment = await repo.save(payment);
      return res.json(updatedPayment);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Payment);
      const payment = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      await repo.softDelete(payment.id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/payments/revenue/daily
   * Tính tổng doanh thu trong ngày
   * Query params: date (YYYY-MM-DD, mặc định là hôm nay), parkingLotId (optional)
   */
  static async getDailyRevenue(req: Request, res: Response) {
    try {
      // Lấy ngày từ query parameter hoặc mặc định là hôm nay
      const dateParam = req.query.date as string | undefined;
      let targetDate: Date;
      
      if (dateParam) {
        targetDate = new Date(dateParam);
        if (isNaN(targetDate.getTime())) {
          return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
        }
      } else {
        targetDate = new Date();
      }

      // Set time về 00:00:00 và 23:59:59 của ngày đó
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Lấy parkingLotId từ query (optional)
      const parkingLotId = req.query.parkingLotId 
        ? parseInt(req.query.parkingLotId as string) 
        : undefined;

      if (parkingLotId && isNaN(parkingLotId)) {
        return res.status(400).json({ error: "Invalid parkingLotId" });
      }

      const sessionRepo = AppDataSource.getRepository(ParkingSession);
      
      // Build query để tính tổng doanh thu từ parking_sessions.fee
      // Tính doanh thu từ các session đã completed trong ngày (dựa vào exit_time)
      const queryBuilder = sessionRepo
        .createQueryBuilder("session")
        .innerJoin("session.parkingSlot", "slot")
        .where("session.status = :status", { status: ParkingSessionStatus.COMPLETED })
        .andWhere("session.exitTime IS NOT NULL")
        .andWhere("session.fee IS NOT NULL")
        .andWhere("session.exitTime >= :startOfDay", { startOfDay })
        .andWhere("session.exitTime <= :endOfDay", { endOfDay });

      // Filter theo parkingLotId nếu có
      if (parkingLotId) {
        queryBuilder.andWhere("slot.parkingLotId = :parkingLotId", { parkingLotId });
      }

      // Tính tổng doanh thu từ fee
      const result = await queryBuilder
        .select("SUM(session.fee)", "totalRevenue")
        .addSelect("COUNT(session.id)", "totalSessions")
        .getRawOne();

      const totalRevenue = result?.totalRevenue ? parseFloat(result.totalRevenue) : 0;
      const totalSessions = result?.totalSessions ? parseInt(result.totalSessions) : 0;

      // Lấy thông tin bãi đỗ xe nếu có filter
      let parkingLotInfo = null;
      if (parkingLotId) {
        const { ParkingLot } = await import("../entity/ParkingLot");
        const parkingLotRepo = AppDataSource.getRepository(ParkingLot);
        const parkingLot = await parkingLotRepo.findOne({
          where: { id: parkingLotId },
        });
        if (parkingLot) {
          parkingLotInfo = {
            id: parkingLot.id,
            name: parkingLot.name,
            location: parkingLot.location,
          };
        }
      }

      return res.json({
        date: targetDate.toISOString().split('T')[0], // YYYY-MM-DD
        parkingLot: parkingLotInfo,
        totalRevenue: totalRevenue,
        totalSessions: totalSessions,
        currency: "VND", // Có thể config sau
      });
    } catch (error: any) {
      console.error("Error in getDailyRevenue:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}

