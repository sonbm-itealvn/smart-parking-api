import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Vehicle, VehicleType } from "../entity/Vehicle";
import { ParkingSession, ParkingSessionStatus } from "../entity/ParkingSession";
import { ParkingSlot, ParkingSlotStatus } from "../entity/ParkingSlot";
import { Notification } from "../entity/Notification";
import { User } from "../entity/User";

interface VehicleDetectionRequest {
  licensePlate: string;
  flag: 0 | 1; // 0 = xe vào, 1 = xe ra
  slotId?: number; // ID của slot (nếu FastAPI detect được)
  parkingLotId?: number; // ID của bãi đỗ xe
  image?: string; // Ảnh xe (base64) - optional
}

export class VehicleDetectionController {
  /**
   * Webhook endpoint để nhận thông tin từ FastAPI
   * FastAPI sẽ gọi endpoint này sau khi nhận diện biển số
   */
  static async handleVehicleDetection(req: Request, res: Response) {
    try {
      const { licensePlate, flag, slotId, parkingLotId, image }: VehicleDetectionRequest = req.body;

      // Validation
      if (!licensePlate) {
        return res.status(400).json({ error: "License plate is required" });
      }

      if (flag === undefined || (flag !== 0 && flag !== 1)) {
        return res.status(400).json({ error: "Flag must be 0 (entry) or 1 (exit)" });
      }

      // Tìm vehicle trong database
      const vehicleRepo = AppDataSource.getRepository(Vehicle);
      const vehicle = await vehicleRepo.findOne({
        where: { licensePlate },
        relations: ["user"],
      });

      if (flag === 0) {
        // XE VÀO (flag = 0)
        return await VehicleDetectionController.handleVehicleEntry(
          res,
          licensePlate,
          vehicle,
          slotId,
          parkingLotId
        );
      } else {
        // XE RA (flag = 1)
        return await VehicleDetectionController.handleVehicleExit(
          res,
          licensePlate,
          vehicle
        );
      }
    } catch (error: any) {
      console.error("Error in handleVehicleDetection:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Xử lý khi xe vào
   */
  private static async handleVehicleEntry(
    res: Response,
    licensePlate: string,
    vehicle: Vehicle | null,
    slotId?: number,
    parkingLotId?: number
  ) {
    const sessionRepo = AppDataSource.getRepository(ParkingSession);
    const slotRepo = AppDataSource.getRepository(ParkingSlot);
    const notificationRepo = AppDataSource.getRepository(Notification);

    // Kiểm tra xem có session active nào với biển số này không
    // Tìm theo vehicleId (nếu có) hoặc licensePlate (xe vãng lai)
    let activeSession = null;
    if (vehicle) {
      activeSession = await sessionRepo.findOne({
        where: {
          vehicleId: vehicle.id,
          status: ParkingSessionStatus.ACTIVE,
        },
        relations: ["vehicle"],
      });
    } else {
      // Kiểm tra xe vãng lai có session active không
      activeSession = await sessionRepo.findOne({
        where: {
          licensePlate: licensePlate,
          vehicleId: null, // Xe vãng lai
          status: ParkingSessionStatus.ACTIVE,
        },
      });
    }

    if (activeSession) {
      return res.status(400).json({
        error: "Vehicle already has an active parking session",
        sessionId: activeSession.id,
      });
    }

    // Tìm slot trống - BẮT BUỘC phải có parkingLotId
    if (!parkingLotId) {
      return res.status(400).json({ 
        error: "parkingLotId is required to assign vehicle to a specific parking lot" 
      });
    }

    let availableSlot: ParkingSlot | null = null;

    if (slotId) {
      // Nếu FastAPI đã detect được slot - kiểm tra slot có thuộc đúng parkingLotId không
      availableSlot = await slotRepo.findOne({
        where: { 
          id: slotId, 
          parkingLotId: parkingLotId, // Đảm bảo slot thuộc đúng bãi đỗ
          status: ParkingSlotStatus.AVAILABLE 
        },
        relations: ["parkingLot"],
      });

      if (!availableSlot) {
        return res.status(404).json({ 
          error: `Slot ${slotId} not found or not available in parking lot ${parkingLotId}` 
        });
      }
    } else {
      // Tìm slot trống đầu tiên trong bãi đỗ được chỉ định
      availableSlot = await slotRepo.findOne({
        where: {
          parkingLotId: parkingLotId,
          status: ParkingSlotStatus.AVAILABLE,
        },
        relations: ["parkingLot"],
        order: { id: "ASC" }, // Lấy slot đầu tiên để có thứ tự nhất quán
      });
    }

    if (!availableSlot) {
      return res.status(404).json({ 
        error: `No available parking slot found in parking lot ${parkingLotId}` 
      });
    }

    // Đảm bảo slot thuộc đúng bãi đỗ (double check)
    if (availableSlot.parkingLotId !== parkingLotId) {
      return res.status(400).json({ 
        error: `Slot ${availableSlot.id} does not belong to parking lot ${parkingLotId}` 
      });
    }

    // Xử lý vehicle
    const vehicleRepo = AppDataSource.getRepository(Vehicle);

    if (vehicle) {
      // Xe đã đăng ký trong hệ thống
      // Tạo parking session
      const newSession = sessionRepo.create({
        vehicleId: vehicle.id,
        licensePlate: licensePlate, // Lưu biển số để dễ query
        parkingSlotId: availableSlot.id,
        entryTime: new Date(),
        status: ParkingSessionStatus.ACTIVE,
      });
      const savedSession = await sessionRepo.save(newSession);

      // Cập nhật slot status
      availableSlot.status = ParkingSlotStatus.OCCUPIED;
      await slotRepo.save(availableSlot);

      // Gửi thông báo cho user
      if (vehicle.userId) {
        const notification = notificationRepo.create({
          userId: vehicle.userId,
          message: `Xe của bạn (${licensePlate}) đã vào bãi đỗ tại vị trí ${availableSlot.slotCode}`,
          isRead: false,
        });
        await notificationRepo.save(notification);
      }

      return res.json({
        message: "Vehicle entry processed successfully",
        isRegistered: true,
        vehicle: {
          id: vehicle.id,
          licensePlate: vehicle.licensePlate,
          userId: vehicle.userId,
        },
        parkingSession: savedSession,
        slot: {
          id: availableSlot.id,
          slotCode: availableSlot.slotCode,
        },
        notificationSent: !!vehicle.userId,
      });
    } else {
      // Xe vãng lai - không cần tạo vehicle, chỉ lưu biển số
      // Tạo parking session với vehicleId = null và lưu licensePlate
      try {
        const newSession = sessionRepo.create({
          vehicleId: null, // Xe vãng lai không có vehicleId
          licensePlate: licensePlate, // Lưu biển số để tính tiền khi ra
          parkingSlotId: availableSlot.id,
          entryTime: new Date(),
          status: ParkingSessionStatus.ACTIVE,
        });
        
        // Đảm bảo không set vehicle relation
        newSession.vehicle = null;
        
        const savedSession = await sessionRepo.save(newSession);

        // Cập nhật slot status
        availableSlot.status = ParkingSlotStatus.OCCUPIED;
        await slotRepo.save(availableSlot);

        return res.json({
          message: "Vehicle entry processed - Guest vehicle (pay by hour)",
          isRegistered: false,
          licensePlate,
          parkingSession: savedSession,
          slot: {
            id: availableSlot.id,
            slotCode: availableSlot.slotCode,
          },
          note: "This is a guest vehicle, will be charged by hour when exiting",
        });
      } catch (dbError: any) {
        // Nếu lỗi về schema, hướng dẫn chạy migration
        if (dbError.message && (dbError.message.includes("user_id") || dbError.message.includes("default value"))) {
          console.error("Database schema error. Please run the SQL migration script:");
          console.error("See fix_parking_session_schema.sql file");
          return res.status(500).json({
            error: "Database schema needs to be updated. Please run the migration script: fix_parking_session_schema.sql",
            details: dbError.message,
          });
        }
        throw dbError;
      }
    }
  }

  /**
   * Xử lý khi xe ra
   */
  private static async handleVehicleExit(
    res: Response,
    licensePlate: string,
    vehicle: Vehicle | null
  ) {
    const sessionRepo = AppDataSource.getRepository(ParkingSession);
    const notificationRepo = AppDataSource.getRepository(Notification);

    // Tìm session active với biển số này
    // Nếu có vehicle thì tìm theo vehicleId, nếu không thì tìm theo licensePlate (xe vãng lai)
    let activeSession = null;
    if (vehicle) {
      activeSession = await sessionRepo.findOne({
        where: {
          vehicleId: vehicle.id,
          status: ParkingSessionStatus.ACTIVE,
        },
        relations: ["vehicle", "parkingSlot", "parkingSlot.parkingLot"],
      });
    } else {
      // Tìm session của xe vãng lai theo licensePlate
      activeSession = await sessionRepo.findOne({
        where: {
          licensePlate: licensePlate,
          vehicleId: null, // Xe vãng lai
          status: ParkingSessionStatus.ACTIVE,
        },
        relations: ["parkingSlot", "parkingSlot.parkingLot"],
      });
    }

    if (!activeSession) {
      return res.status(404).json({
        error: "No active parking session found for this vehicle",
        licensePlate,
      });
    }

    // Tính tiền và cho xe ra (sử dụng logic tương tự từ ParkingSessionController)
    const slotRepo = AppDataSource.getRepository(ParkingSlot);
    const exitTime = new Date();
    const entryTime = new Date(activeSession.entryTime);
    const durationMs = exitTime.getTime() - entryTime.getTime();
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
    const totalHours = durationHours < 1 ? 1 : durationHours;

    // Lấy giá mỗi giờ từ parking lot
    const parkingLot = activeSession.parkingSlot?.parkingLot;
    if (!parkingLot || !parkingLot.pricePerHour) {
      return res.status(400).json({
        error: "Parking lot pricePerHour not found",
        licensePlate,
      });
    }

    const pricePerHour = Number(parkingLot.pricePerHour);
    if (!pricePerHour || pricePerHour <= 0) {
      return res.status(400).json({
        error: "Invalid pricePerHour for parking lot",
        licensePlate,
      });
    }

    // Tính phí theo cơ chế: Giờ đầu = pricePerHour, mỗi giờ tiếp theo tăng 10%
    const INCREASE_RATE = 1.1;

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
    activeSession.exitTime = exitTime;
    activeSession.fee = totalFee;
    activeSession.status = ParkingSessionStatus.COMPLETED;
    await sessionRepo.save(activeSession);

    // Cập nhật parking slot status thành available
    const parkingSlot = await slotRepo.findOne({
      where: { id: activeSession.parkingSlotId },
    });
    if (parkingSlot) {
      parkingSlot.status = ParkingSlotStatus.AVAILABLE;
      await slotRepo.save(parkingSlot);
    }

    // Gửi thông báo cho user (chỉ khi có vehicle đã đăng ký)
    if (vehicle && vehicle.userId) {
      const notification = notificationRepo.create({
        userId: vehicle.userId,
        message: `Xe của bạn (${licensePlate}) đã ra khỏi bãi đỗ. Phí: ${totalFee.toLocaleString("vi-VN")} VNĐ`,
        isRead: false,
      });
      await notificationRepo.save(notification);
    }

    // Reload session với relations
    const updatedSession = await sessionRepo.findOne({
      where: { id: activeSession.id },
      relations: ["vehicle", "parkingSlot", "parkingSlot.parkingLot", "payments"],
    });

    return res.json({
      message: "Vehicle exit processed successfully",
      isRegistered: !!vehicle,
      licensePlate: licensePlate,
      vehicle: vehicle ? {
        id: vehicle.id,
        licensePlate: vehicle.licensePlate,
        userId: vehicle.userId,
      } : null,
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
      notificationSent: !!(vehicle && vehicle.userId),
    });
  }
}

