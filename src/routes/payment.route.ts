import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";

const router = Router();

router.post("/", PaymentController.create);
router.get("/", PaymentController.getAll);
router.get("/:id", PaymentController.getById);
router.put("/:id", PaymentController.update);
router.delete("/:id", PaymentController.delete);

export default router;

