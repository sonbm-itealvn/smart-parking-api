import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { validateRegister, validateLogin } from "../middleware/validation.middleware";

const router = Router();

router.post("/register", validateRegister, AuthController.register);
router.post("/login", validateLogin, AuthController.login);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/logout", AuthController.logout);
router.get("/profile", authenticateToken, AuthController.getProfile);

export default router;

