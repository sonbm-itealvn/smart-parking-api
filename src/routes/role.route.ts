import { Router } from "express";
import { RoleController } from "../controllers/role.controller";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

// Only admin can create, update, or delete roles
router.post("/", requireAdmin, RoleController.create);
router.get("/", RoleController.getAll);
router.get("/:id", RoleController.getById);
router.put("/:id", requireAdmin, RoleController.update);
router.delete("/:id", requireAdmin, RoleController.delete);

export default router;

