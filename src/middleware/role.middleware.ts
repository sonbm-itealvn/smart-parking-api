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

/**
 * Middleware để kiểm tra user chỉ có thể sửa thông tin của chính mình
 * Admin có thể sửa bất kỳ user nào
 */
export const requireOwnResourceOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userRole = req.user.roleName || "";
  const userId = req.user.userId;
  const resourceId = parseInt(req.params.id);

  // Admin có thể truy cập bất kỳ resource nào
  if (userRole === "Admin") {
    return next();
  }

  // User chỉ có thể truy cập resource của chính mình
  if (userId === resourceId) {
    return next();
  }

  return res.status(403).json({
    error: "Access denied. You can only modify your own resources.",
  });
};

