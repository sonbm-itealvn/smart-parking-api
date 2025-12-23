import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from "./User";

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "varchar", length: 500 })
  token!: string;

  @Column({ type: "bigint", name: "user_id" })
  userId!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "timestamp", name: "expires_at" })
  expiresAt!: Date;

  @Column({ type: "boolean", name: "is_revoked", default: false })
  isRevoked!: boolean;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;
}

