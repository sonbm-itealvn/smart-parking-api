import express from "express";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import roleRoutes from "./routes/role.route";
import parkingLotRoutes from "./routes/parking-lot.route";
import parkingSlotRoutes from "./routes/parking-slot.route";
import vehicleRoutes from "./routes/vehicle.route";
import notificationRoutes from "./routes/notification.route";
import parkingSessionRoutes from "./routes/parking-session.route";
import paymentRoutes from "./routes/payment.route";
import { authenticateToken } from "./middleware/auth.middleware";
import { corsMiddleware } from "./config/cors";
import { swaggerSpec } from "./config/swagger";

const app = express();

// CORS Configuration
app.use(corsMiddleware);
app.use(express.json());

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Smart Parking API Documentation",
}));

// Public Routes (No authentication required)
app.use("/api/auth", authRoutes);

// Protected Routes (Authentication required)
app.use("/api/roles", authenticateToken, roleRoutes);
app.use("/api/users", authenticateToken, userRoutes);
app.use("/api/parking-lots", authenticateToken, parkingLotRoutes);
app.use("/api/parking-slots", authenticateToken, parkingSlotRoutes);
app.use("/api/vehicles", authenticateToken, vehicleRoutes);
app.use("/api/notifications", authenticateToken, notificationRoutes);
app.use("/api/parking-sessions", authenticateToken, parkingSessionRoutes);
app.use("/api/payments", authenticateToken, paymentRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: Server is running
 */
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

export default app;
