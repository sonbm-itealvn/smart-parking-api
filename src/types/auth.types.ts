import { Request } from "express";

export interface JwtPayload {
  userId: number;
  email: string;
  roleId: number;
  roleName?: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
  roleId?: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

