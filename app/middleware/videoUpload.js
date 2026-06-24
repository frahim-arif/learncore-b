const multer = require("multer");
const path = require("path");

// Storage Location
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/videos");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "_" + Math.round(Math.random() * 1e9) + ext);
  },
});

// File Filter – only video allowed
function videoFilter(req, file, cb) {
  const allowed = ["video/mp4", "video/mkv", "video/avi", "video/mov"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only video files are allowed"), false);
  }
}

const uploadVideo = multer({
  storage: storage,
  fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
});

module.exports = uploadVideo;
