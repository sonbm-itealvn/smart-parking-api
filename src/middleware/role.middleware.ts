import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth.types";

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // If roleName is not in the token, you might need to fetch it from database
    // For now, assuming roleName is in the JWT payload
    const userRole = req.user.roleName || "";

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

// Convenience middleware for common roles
export const requireAdmin = authorizeRoles("Admin");
export const requireUser = authorizeRoles("User", "Admin");

