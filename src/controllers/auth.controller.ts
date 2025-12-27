import { Response } from "express";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { AppDataSource } from "../config/database";
import { User } from "../entity/User";
import { RefreshToken } from "../entity/RefreshToken";
import { RegisterDto, LoginDto, AuthRequest, RefreshTokenDto } from "../types/auth.types";

const JWT_SECRET: string = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key-change-in-production";
const JWT_EXPIRES_IN: StringValue = (process.env.JWT_EXPIRES_IN || "15m") as StringValue; // Access token: 15 minutes
const JWT_REFRESH_EXPIRES_IN: StringValue = (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as StringValue; // Refresh token: 7 days

// Helper function to generate tokens
const generateTokens = async (user: User) => {
  try {
    // Validate user data
    if (!user || !user.id || !user.email) {
      throw new Error("Invalid user data for token generation");
    }

    const accessTokenOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN };
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role?.name || null,
      },
      JWT_SECRET,
      accessTokenOptions
    );

    const refreshTokenOptions: SignOptions = { expiresIn: JWT_REFRESH_EXPIRES_IN };
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_REFRESH_SECRET,
      refreshTokenOptions
    );

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Save refresh token to database
    try {
      const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
      const refreshTokenEntity = refreshTokenRepo.create({
        token: refreshToken,
        userId: user.id,
        expiresAt,
        isRevoked: false,
      });
      await refreshTokenRepo.save(refreshTokenEntity);
    } catch (dbError: any) {
      console.error("Error saving refresh token to database:", dbError);
      // Continue even if saving refresh token fails, but log the error
    }

    return { accessToken, refreshToken };
  } catch (error: any) {
    console.error("Error in generateTokens:", error);
    throw error;
  }
};

export class AuthController {
  static async register(req: AuthRequest, res: Response) {
    try {
      const { fullName, email, password, roleId }: RegisterDto = req.body;

      // Validation
      if (!fullName || !email || !password) {
        return res.status(400).json({
          error: "Full name, email, and password are required",
        });
      }

      // Check if user already exists
      const userRepo = AppDataSource.getRepository(User);
      const existingUser = await userRepo.findOne({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          error: "User with this email already exists",
        });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user (default roleId = 1 for regular USER if not provided)
      // Note: roleId = 1 is USER, roleId = 2 is ADMIN
      const newUser = userRepo.create({
        fullName,
        email,
        passwordHash,
        roleId: roleId || 1, // Default to roleId = 1 (USER) if not provided
      });

      const savedUser = await userRepo.save(newUser);

      // Reload user with role relation
      const userWithRole = await userRepo.findOne({
        where: { id: savedUser.id },
        relations: ["role"],
      });

      if (!userWithRole) {
        return res.status(500).json({ error: "Failed to create user" });
      }

      // Generate access token and refresh token
      const { accessToken, refreshToken } = await generateTokens(userWithRole);

      // Return user data without password
      const { passwordHash: _, ...userWithoutPassword } = userWithRole;

      return res.status(201).json({
        message: "User registered successfully",
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async login(req: AuthRequest, res: Response) {
    try {
      const { email, password }: LoginDto = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          error: "Email and password are required",
        });
      }

      // Find user
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { email },
        relations: ["role"],
      });

      if (!user) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      // Generate access token and refresh token
      let accessToken: string;
      let refreshToken: string;
      
      try {
        const tokens = await generateTokens(user);
        accessToken = tokens.accessToken;
        refreshToken = tokens.refreshToken;
      } catch (tokenError: any) {
        console.error("Error generating tokens:", tokenError);
        return res.status(500).json({ 
          error: "Failed to generate tokens",
          details: tokenError.message 
        });
      }

      // Return user data without password
      const { passwordHash: _, ...userWithoutPassword } = user;

      return res.json({
        message: "Login successful",
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: req.user.userId },
        relations: ["role", "vehicles", "notifications"],
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { passwordHash: _, ...userWithoutPassword } = user;

      return res.json(userWithoutPassword);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async refreshToken(req: AuthRequest, res: Response) {
    try {
      const { refreshToken: token }: RefreshTokenDto = req.body;

      if (!token) {
        return res.status(400).json({
          error: "Refresh token is required",
        });
      }

      // Verify refresh token
      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_REFRESH_SECRET);
      } catch (err) {
        return res.status(403).json({
          error: "Invalid or expired refresh token",
        });
      }

      // Check if refresh token exists in database and is not revoked
      const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
      const refreshTokenEntity = await refreshTokenRepo.findOne({
        where: { token, userId: decoded.userId },
        relations: ["user", "user.role"],
      });

      if (!refreshTokenEntity || refreshTokenEntity.isRevoked) {
        return res.status(403).json({
          error: "Refresh token has been revoked",
        });
      }

      // Check if token is expired
      if (refreshTokenEntity.expiresAt < new Date()) {
        return res.status(403).json({
          error: "Refresh token has expired",
        });
      }

      const user = refreshTokenEntity.user;

      // Generate new access token
      const accessTokenOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN };
      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          roleId: user.roleId,
          roleName: user.role?.name,
        },
        JWT_SECRET,
        accessTokenOptions
      );

      return res.json({
        message: "Token refreshed successfully",
        accessToken,
        refreshToken: token, // Return the same refresh token
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async logout(req: AuthRequest, res: Response) {
    try {
      const { refreshToken: token }: RefreshTokenDto = req.body;

      if (!token) {
        return res.status(400).json({
          error: "Refresh token is required",
        });
      }

      // Revoke refresh token
      const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
      const refreshTokenEntity = await refreshTokenRepo.findOne({
        where: { token },
      });

      if (refreshTokenEntity && !refreshTokenEntity.isRevoked) {
        refreshTokenEntity.isRevoked = true;
        await refreshTokenRepo.save(refreshTokenEntity);
      }

      return res.json({
        message: "Logout successful",
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

