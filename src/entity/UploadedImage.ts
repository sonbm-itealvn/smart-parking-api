import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("uploaded_images")
export class UploadedImage {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "varchar", length: 255, comment: "Cloudinary public_id" })
  filename!: string;

  @Column({ type: "varchar", length: 255, name: "original_name" })
  originalName!: string;

  @Column({ type: "varchar", length: 100 })
  mimetype!: string;

  @Column({ type: "bigint" })
  size!: number;

  @Column({ type: "varchar", length: 500, comment: "Cloudinary secure_url (backward compatibility)" })
  path!: string;

  @Column({ type: "varchar", length: 500, nullable: true, comment: "Cloudinary secure_url" })
  url!: string | null;

  @Column({ type: "bigint", name: "user_id", nullable: true })
  userId!: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  description!: string | null;

  @Column({ type: "timestamp", name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column({ type: "timestamp", name: "updated_at", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}

