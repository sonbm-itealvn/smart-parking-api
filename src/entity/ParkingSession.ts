import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Vehicle } from "./Vehicle";
import { ParkingSlot } from "./ParkingSlot";
import { Payment } from "./Payment";

export enum ParkingSessionStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

@Entity("parking_sessions")
export class ParkingSession {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "bigint", name: "vehicle_id" })
  vehicleId!: number;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.parkingSessions)
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: Vehicle;

  @Column({ type: "bigint", name: "parking_slot_id" })
  parkingSlotId!: number;

  @ManyToOne(() => ParkingSlot, (slot) => slot.parkingSessions)
  @JoinColumn({ name: "parking_slot_id" })
  parkingSlot!: ParkingSlot;

  @Column({ type: "datetime", name: "entry_time" })
  entryTime!: Date;

  @Column({ type: "datetime", name: "exit_time", nullable: true })
  exitTime!: Date | null;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  fee!: number | null;

  @Column({
    type: "enum",
    enum: ParkingSessionStatus,
    default: ParkingSessionStatus.ACTIVE,
  })
  status!: ParkingSessionStatus;

  @OneToMany(() => Payment, (payment) => payment.parkingSession)
  payments!: Payment[];
}

