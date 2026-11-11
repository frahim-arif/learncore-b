const Course = require("../../models/Course");

module.exports = (server) => {
  server.get("/api/public/courses", async (req, res) => {
    try {
      const courses = await Course.find({
        isPublished: true,
      })
        .populate("skill", "name slug")
        .select(
          "title slug description price duration accessType skill displayOrder createdAt"
        )
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean();

      return res.json({
        success: true,
        count: courses.length,
        courses,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });
};