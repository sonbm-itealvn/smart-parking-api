import { Router } from "express";
import { ParkingSlotController } from "../controllers/parking-slot.controller";

const router = Router();

router.post("/", ParkingSlotController.create);
router.get("/", ParkingSlotController.getAll);
router.get("/:id", ParkingSlotController.getById);
router.put("/:id", ParkingSlotController.update);
router.delete("/:id", ParkingSlotController.delete);

export default router;

