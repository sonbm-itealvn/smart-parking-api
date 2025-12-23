import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { User } from "./User";

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];
}

