import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { ParkingLot } from "./ParkingLot";

export enum CameraStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  MAINTENANCE = "maintenance",
}

export enum CameraType {
  RTSP = "rtsp",
  HTTP = "http",
  WEBCAM = "webcam",
}

@Entity("cameras")
export class Camera {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 500, name: "stream_url" })
  streamUrl!: string;

  @Column({
    type: "enum",
    enum: CameraType,
    name: "camera_type",
    default: CameraType.RTSP,
  })
  cameraType!: CameraType;

  @Column({
    type: "enum",
    enum: CameraStatus,
    default: CameraStatus.ACTIVE,
  })
  status!: CameraStatus;

  @Column({ type: "bigint", name: "parking_lot_id", nullable: true })
  parkingLotId!: number | null;

  @ManyToOne(() => ParkingLot, { nullable: true })
  @JoinColumn({ name: "parking_lot_id" })
  parkingLot!: ParkingLot | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true, name: "location" })
  location!: string | null;

  @Column({ type: "timestamp", name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column({ type: "timestamp", name: "updated_at", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}

