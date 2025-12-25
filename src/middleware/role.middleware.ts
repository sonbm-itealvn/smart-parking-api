import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth.types";

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check both roleName and roleId
    const userRole = req.user.roleName || "";
    const userRoleId = req.user.roleId;

    // Check if roleName matches (case-insensitive)
    const roleNameMatch = allowedRoles.some(
      (role) => userRole.toLowerCase() === role.toLowerCase()
    );

    if (!roleNameMatch) {
      return res.status(403).json({
        error: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

// Convenience middleware for common roles
// Admin role: roleId = 2, roleName = "ADMIN"
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userRoleId = req.user.roleId;
  const userRoleName = (req.user.roleName || "").toUpperCase();

  // Check if user is admin: roleId = 2 OR roleName = "ADMIN"
  if (userRoleId === 2 || userRoleName === "ADMIN") {
    return next();
  }

  return res.status(403).json({
    error: "Access denied. Admin privileges required.",
  });
};

export const requireUser = authorizeRoles("User", "Admin", "ADMIN");

/**
 * Middleware để kiểm tra user chỉ có thể sửa thông tin của chính mình
 * Admin có thể sửa bất kỳ user nào
 */
export const requireOwnResourceOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userRoleId = req.user.roleId;
  const userRoleName = (req.user.roleName || "").toUpperCase();
  const userId = req.user.userId;
  const resourceId = parseInt(req.params.id);

  // Admin có thể truy cập bất kỳ resource nào (roleId = 2 OR roleName = "ADMIN")
  if (userRoleId === 2 || userRoleName === "ADMIN") {
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

