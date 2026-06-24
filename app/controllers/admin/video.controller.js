const Video = require("../../models/Video.model");

exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Video file is required" });
    }

    const video = new Video({
      title: req.body.title,
      videoUrl: "/uploads/videos/" + req.file.filename,
    });

    await video.save();

    res.status(200).json({
      message: "Video uploaded successfully",
      data: video,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
