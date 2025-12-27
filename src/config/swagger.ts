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
          map: { type: "string", nullable: true, description: "URL ảnh bản đồ của bãi đỗ xe" },
          mapWidth: { type: "integer", nullable: true, description: "Chiều rộng gốc của ảnh map (pixels)" },
          mapHeight: { type: "integer", nullable: true, description: "Chiều cao gốc của ảnh map (pixels)" },
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
          coordinates: {
            type: "array",
            items: {
              type: "array",
              items: {
                type: "array",
                items: {
                  type: "number",
                },
              },
            },
            description: "Polygon coordinates của ô đỗ xe dưới dạng GeoJSON format: [[[x1,y1], [x2,y2], [x3,y3], [x4,y4], [x1,y1]]]",
            nullable: true,
            example: [[[0, 0], [100, 0], [100, 50], [0, 50], [0, 0]]],
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
      UploadedImage: {
        type: "object",
        properties: {
          id: { type: "integer", format: "int64" },
          filename: { type: "string", description: "Tên file unique trên server" },
          originalName: { type: "string", description: "Tên file gốc từ client" },
          mimetype: { type: "string", description: "MIME type của file" },
          size: { type: "integer", format: "int64", description: "Kích thước file (bytes)" },
          path: { type: "string", description: "Đường dẫn file trên server" },
          url: { type: "string", nullable: true, description: "URL để truy cập file" },
          userId: { type: "integer", format: "int64", nullable: true, description: "ID của user upload" },
          description: { type: "string", nullable: true, description: "Mô tả ảnh" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Camera: {
        type: "object",
        properties: {
          id: { type: "integer", format: "int64" },
          name: { type: "string", description: "Tên camera" },
          streamUrl: { type: "string", description: "URL stream của camera (RTSP, HTTP, hoặc webcam)" },
          cameraType: { 
            type: "string", 
            enum: ["rtsp", "http", "webcam"],
            description: "Loại camera stream" 
          },
          status: { 
            type: "string", 
            enum: ["active", "inactive", "maintenance"],
            description: "Trạng thái camera" 
          },
          parkingLotId: { type: "integer", format: "int64", nullable: true, description: "ID của bãi đỗ xe" },
          description: { type: "string", nullable: true, description: "Mô tả camera" },
          location: { type: "string", nullable: true, description: "Vị trí camera" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
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
    {
      name: "Upload Images",
      description: "Image upload and management endpoints",
    },
    {
      name: "Cameras",
      description: "Camera management and stream endpoints",
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"], // Paths to files containing OpenAPI definitions
};

export const swaggerSpec = swaggerJsdoc(options);

