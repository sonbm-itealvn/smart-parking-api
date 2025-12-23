import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JwtPayload } from "../types/auth.types";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token is required" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }

      req.user = decoded as JwtPayload;
      next();
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

