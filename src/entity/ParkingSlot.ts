import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { ParkingLot } from "./ParkingLot";
import { ParkingSession } from "./ParkingSession";

export enum ParkingSlotStatus {
  AVAILABLE = "available",
  OCCUPIED = "occupied",
  OUT_OF_SERVICE = "out_of_service",
}

@Entity("parking_slots")
export class ParkingSlot {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "bigint", name: "parking_lot_id" })
  parkingLotId!: number;

  @ManyToOne(() => ParkingLot, (parkingLot) => parkingLot.parkingSlots)
  @JoinColumn({ name: "parking_lot_id" })
  parkingLot!: ParkingLot;

  @Column({ type: "varchar", length: 50, name: "slot_code" })
  slotCode!: string;

  @Column({
    type: "enum",
    enum: ParkingSlotStatus,
    default: ParkingSlotStatus.AVAILABLE,
  })
  status!: ParkingSlotStatus;

  @OneToMany(() => ParkingSession, (session) => session.parkingSlot)
  parkingSessions!: ParkingSession[];
}

