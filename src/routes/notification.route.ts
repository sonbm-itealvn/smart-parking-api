import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";

const router = Router();

router.post("/", NotificationController.create);
router.get("/", NotificationController.getAll);
router.get("/:id", NotificationController.getById);
router.put("/:id", NotificationController.update);
router.delete("/:id", NotificationController.delete);

export default router;

