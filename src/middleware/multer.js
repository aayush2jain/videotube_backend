import multer from "multer";

// Use multer's memoryStorage to store files in memory as buffers
const storage = multer.memoryStorage();

export const upload = multer({ storage });
