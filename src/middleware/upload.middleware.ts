import multer from "multer";

// Cấu hình multer để lưu file vào memory
const storage = multer.memoryStorage();

// File filter để chỉ chấp nhận image và video
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    // Videos
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and videos are allowed."));
  }
};

// Upload middleware với giới hạn 100MB
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// Middleware cho image upload - chấp nhận field "image" hoặc "file"
export const uploadImage = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

// Middleware cho video upload - chấp nhận field "video" hoặc "file"
export const uploadVideo = upload.fields([
  { name: "video", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

// Middleware cho mixed upload (image hoặc video) - chấp nhận nhiều field names
export const uploadMixed = upload.fields([
  { name: "file", maxCount: 1 },
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 },
]);

// Middleware cho upload image vào disk (dùng cho upload image service)
import path from "path";
import fs from "fs";

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads", "images");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Tên file sẽ được generate trong service
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Upload middleware cho image service - lưu vào disk
export const uploadImageToDisk = multer({
  storage: imageStorage,
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận image
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB cho image
  },
}).fields([
  { name: "image", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

// Middleware cho image upload optional - chỉ apply multer nếu là multipart/form-data
// Cho phép JSON body (với imageUrl hoặc imageBase64) pass through
export const uploadImageOptional = (req: any, res: any, next: any) => {
  // Kiểm tra nếu là multipart/form-data
  if (req.headers["content-type"] && req.headers["content-type"].includes("multipart/form-data")) {
    // Áp dụng multer middleware
    return uploadImage(req, res, next);
  } else {
    // Không phải multipart, bỏ qua multer và tiếp tục
    next();
  }
};

