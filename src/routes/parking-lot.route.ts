import { Router } from "express";
import { ParkingLotController } from "../controllers/parking-lot.controller";

const router = Router();

router.post("/", ParkingLotController.create);
router.get("/", ParkingLotController.getAll);
router.get("/:id", ParkingLotController.getById);
router.put("/:id", ParkingLotController.update);
router.delete("/:id", ParkingLotController.delete);

export default router;

