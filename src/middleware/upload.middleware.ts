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

