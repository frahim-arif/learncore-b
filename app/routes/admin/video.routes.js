const uploadVideo = require("../../middleware/videoUpload");
const controller = require("../../controllers/admin/video.controller");

module.exports = function (server) {
  server.post(
    "/admin/upload-video",
    uploadVideo.single("video"),
    controller.uploadVideo
  );
};
