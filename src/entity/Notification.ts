import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn } from "typeorm";
import { User } from "./User";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "bigint", name: "user_id" })
  userId!: number;

  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "varchar", length: 500 })
  message!: string;

  @Column({ type: "boolean", name: "is_read", default: false })
  isRead!: boolean;

  @Column({ type: "timestamp", name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @DeleteDateColumn({ type: "timestamp", name: "deleted_at", nullable: true })
  deletedAt!: Date | null;
}

