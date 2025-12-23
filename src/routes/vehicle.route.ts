import { Router } from "express";
import { VehicleController } from "../controllers/vehicle.controller";

const router = Router();

router.post("/", VehicleController.create);
router.get("/", VehicleController.getAll);
router.get("/:id", VehicleController.getById);
router.put("/:id", VehicleController.update);
router.delete("/:id", VehicleController.delete);

export default router;

