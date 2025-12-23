import swaggerJsdoc from "swagger-jsdoc";
import { SwaggerDefinition } from "swagger-jsdoc";

const swaggerDefinition: SwaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Smart Parking API",
    version: "1.0.0",
    description: "API documentation for Smart Parking Management System",
    contact: {
      name: "API Support",
      email: "support@smartparking.com",
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 3000}`,
      description: "Development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter JWT token",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer", format: "int64" },
          fullName: { type: "string" },
          email: { type: "string", format: "email" },
          roleId: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Role: {
        type: "object",
        properties: {
          id: { type: "integer", format: "int64" },
          name: { type: "string" },
        },
      },
      ParkingLot: {
        type: "object",
        properties: {
          id: { type: "integer", format: "int64" },
          name: { type: "string" },
          location: { type: "string" },
          totalSlots: { type: "integer" },
          pricePerHour: { type: "number", format: "decimal" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ParkingSlot: {
        type: "object",
        properties: {
          id: { type: "integer", format: "int64" },
          parkingLotId: { type: "integer", format: "int64" },
          slotCode: { type: "string" },
          status: {
            type: "string",
            enum: ["available", "occupied", "out_of_service"],
          },
        },
      },
      Vehicle: {
        type: "object",
        properties: {
          id: { type: "integer", format: "int64" },
          userId: { type: "integer", format: "int64" },
          licensePlate: { type: "string" },
          vehicleType: {
            type: "string",
            enum: ["car", "motorcycle", "truck"],
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "integer", format: "int64" },
          userId: { type: "integer", format: "int64" },
          message: { type: "string" },
          isRead: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ParkingSession: {
        type: "object",
        properties: {
          id: { type: "integer", format: "int64" },
          vehicleId: { type: "integer", format: "int64" },
          parkingSlotId: { type: "integer", format: "int64" },
          entryTime: { type: "string", format: "date-time" },
          exitTime: { type: "string", format: "date-time", nullable: true },
          fee: { type: "number", format: "decimal", nullable: true },
          status: {
            type: "string",
            enum: ["active", "completed", "cancelled"],
          },
        },
      },
      Payment: {
        type: "object",
        properties: {
          id: { type: "integer", format: "int64" },
          parkingSessionId: { type: "integer", format: "int64" },
          amount: { type: "number", format: "decimal" },
          paymentMethod: {
            type: "string",
            enum: ["credit_card", "cash", "mobile_pay"],
          },
          paymentTime: { type: "string", format: "date-time" },
          status: {
            type: "string",
            enum: ["successful", "failed", "pending"],
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["fullName", "email", "password"],
        properties: {
          fullName: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password", minLength: 6 },
          roleId: { type: "integer", description: "Optional, default: 2" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string" },
        },
      },
    },
  },
  tags: [
    {
      name: "Authentication",
      description: "Authentication endpoints",
    },
    {
      name: "Users",
      description: "User management endpoints",
    },
    {
      name: "Roles",
      description: "Role management endpoints",
    },
    {
      name: "Parking Lots",
      description: "Parking lot management endpoints",
    },
    {
      name: "Parking Slots",
      description: "Parking slot management endpoints",
    },
    {
      name: "Vehicles",
      description: "Vehicle management endpoints",
    },
    {
      name: "Notifications",
      description: "Notification management endpoints",
    },
    {
      name: "Parking Sessions",
      description: "Parking session management endpoints",
    },
    {
      name: "Payments",
      description: "Payment management endpoints",
    },
    {
      name: "Health",
      description: "Health check endpoints",
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"], // Paths to files containing OpenAPI definitions
};

export const swaggerSpec = swaggerJsdoc(options);

