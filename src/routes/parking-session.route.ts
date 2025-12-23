import { Router } from "express";
import { ParkingSessionController } from "../controllers/parking-session.controller";

const router = Router();

router.post("/", ParkingSessionController.create);
router.get("/", ParkingSessionController.getAll);
router.get("/:id", ParkingSessionController.getById);
router.put("/:id", ParkingSessionController.update);
router.delete("/:id", ParkingSessionController.delete);

export default router;

