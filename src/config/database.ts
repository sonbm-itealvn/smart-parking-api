import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Role } from "../entity/Role";
import { User } from "../entity/User";
import { ParkingLot } from "../entity/ParkingLot";
import { ParkingSlot } from "../entity/ParkingSlot";
import { Vehicle } from "../entity/Vehicle";
import { Notification } from "../entity/Notification";
import { ParkingSession } from "../entity/ParkingSession";
import { Payment } from "../entity/Payment";
import { RefreshToken } from "../entity/RefreshToken";
import { UploadedImage } from "../entity/UploadedImage";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    Role,
    User,
    ParkingLot,
    ParkingSlot,
    Vehicle,
    Notification,
    ParkingSession,
    Payment,
    RefreshToken,
    UploadedImage,
  ],
  synchronize: true, // dev OK, prod nên false
  logging: process.env.NODE_ENV === "development", // Bật logging trong dev để debug
});
