import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, DeleteDateColumn } from "typeorm";
import { ParkingSlot } from "./ParkingSlot";

@Entity("parking_lots")
export class ParkingLot {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  location!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  map!: string | null;

  @Column({ type: "int", nullable: true, name: "map_width" })
  mapWidth!: number | null;

  @Column({ type: "int", nullable: true, name: "map_height" })
  mapHeight!: number | null;

  @Column({ type: "int", name: "total_slots" })
  totalSlots!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "price_per_hour" })
  pricePerHour!: number;

  @Column({ type: "timestamp", name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @OneToMany(() => ParkingSlot, (slot) => slot.parkingLot)
  parkingSlots!: ParkingSlot[];

  @DeleteDateColumn({ type: "timestamp", name: "deleted_at", nullable: true })
  deletedAt!: Date | null;
}

