import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, DeleteDateColumn } from "typeorm";
import { User } from "./User";

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];

  @DeleteDateColumn({ type: "timestamp", name: "deleted_at", nullable: true })
  deletedAt!: Date | null;
}

