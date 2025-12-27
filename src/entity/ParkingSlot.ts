import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn } from "typeorm";
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

  @Column({
    type: "json",
    nullable: true,
    name: "coordinates",
    comment: "Polygon coordinates của ô đỗ xe dưới dạng GeoJSON format: [[[x1,y1], [x2,y2], [x3,y3], [x4,y4], [x1,y1]]]",
  })
  coordinates!: number[][][] | null;

  @OneToMany(() => ParkingSession, (session) => session.parkingSlot)
  parkingSessions!: ParkingSession[];

  @DeleteDateColumn({ type: "timestamp", name: "deleted_at", nullable: true })
  deletedAt!: Date | null;
}

