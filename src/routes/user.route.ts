import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

// Only admin can create users via this endpoint (regular users should use /api/auth/register)
router.post("/", requireAdmin, UserController.create);
// Only admin can see all users
router.get("/", requireAdmin, UserController.getAll);
router.get("/:id", UserController.getById);
router.put("/:id", UserController.update);
// Only admin can delete users
router.delete("/:id", requireAdmin, UserController.delete);

export default router;
