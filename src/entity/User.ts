import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Role } from "./Role";
import { Vehicle } from "./Vehicle";
import { Notification } from "./Notification";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "varchar", length: 255, name: "full_name" })
  fullName!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255, name: "password_hash" })
  passwordHash!: string;

  @Column({ type: "int", name: "role_id" })
  roleId!: number;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: "role_id" })
  role!: Role;

  @Column({ type: "timestamp", name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column({ type: "varchar", length: 500, name: "device_token", nullable: true })
  deviceToken!: string | null;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.user)
  vehicles!: Vehicle[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];
}
