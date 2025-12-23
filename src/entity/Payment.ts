import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { ParkingSession } from "./ParkingSession";

export enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  CASH = "cash",
  MOBILE_PAY = "mobile_pay",
}

export enum PaymentStatus {
  SUCCESSFUL = "successful",
  FAILED = "failed",
  PENDING = "pending",
}

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "bigint", name: "parking_session_id" })
  parkingSessionId!: number;

  @ManyToOne(() => ParkingSession, (session) => session.payments)
  @JoinColumn({ name: "parking_session_id" })
  parkingSession!: ParkingSession;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: "enum",
    enum: PaymentMethod,
    name: "payment_method",
  })
  paymentMethod!: PaymentMethod;

  @Column({ type: "datetime", name: "payment_time" })
  paymentTime!: Date;

  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;
}

