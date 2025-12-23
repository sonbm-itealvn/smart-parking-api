import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { ParkingSlot } from "./ParkingSlot";

@Entity("parking_lots")
export class ParkingLot {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  location!: string;

  @Column({ type: "int", name: "total_slots" })
  totalSlots!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "price_per_hour" })
  pricePerHour!: number;

  @Column({ type: "timestamp", name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @OneToMany(() => ParkingSlot, (slot) => slot.parkingLot)
  parkingSlots!: ParkingSlot[];
}

