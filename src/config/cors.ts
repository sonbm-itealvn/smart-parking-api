import cors from "cors";
import { CorsOptions } from "cors";

const getAllowedOrigins = (): string | string[] => {
  const origin = process.env.CORS_ORIGIN;
  
  if (!origin || origin === "*") {
    return "*";
  }
  
  // Nếu có nhiều origins, split bằng comma
  if (origin.includes(",")) {
    return origin.split(",").map((o) => o.trim());
  }
  
  return origin;
};

export const corsOptions: CorsOptions = {
  origin: getAllowedOrigins(),
  credentials: process.env.CORS_CREDENTIALS !== "false", // Default: true
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Authorization"],
  maxAge: Number(process.env.CORS_MAX_AGE) || 86400, // 24 hours default
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// CORS middleware
export const corsMiddleware = cors(corsOptions);

