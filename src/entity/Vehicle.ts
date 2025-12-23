import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./User";
import { ParkingSession } from "./ParkingSession";

export enum VehicleType {
  CAR = "car",
  MOTORCYCLE = "motorcycle",
  TRUCK = "truck",
}

@Entity("vehicles")
export class Vehicle {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "bigint", name: "user_id" })
  userId!: number;

  @ManyToOne(() => User, (user) => user.vehicles)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "varchar", length: 50, name: "license_plate" })
  licensePlate!: string;

  @Column({
    type: "enum",
    enum: VehicleType,
    name: "vehicle_type",
  })
  vehicleType!: VehicleType;

  @Column({ type: "timestamp", name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @OneToMany(() => ParkingSession, (session) => session.vehicle)
  parkingSessions!: ParkingSession[];
}

