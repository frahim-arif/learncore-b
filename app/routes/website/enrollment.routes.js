
const mongoose = require("mongoose");

const Enrollment = require("../../models/Enrollment");
const studentAuth = require("../../middleware/studentAuth");

module.exports = (server) => {
  // GET MY ALL ENROLLMENTS
  server.get("/api/student/enrollments", studentAuth, async (req, res) => {
    try {
      const enrollments = await Enrollment.find({
        student: req.student._id,
      })
        .populate("course", "title slug thumbnail price accessType")
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        count: enrollments.length,
        enrollments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET ENROLLMENT STATUS FOR A COURSE
  server.get(
    "/api/student/enrollments/:courseId",
    studentAuth,
    async (req, res) => {
      try {
        const { courseId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid course ID",
          });
        }

        const enrollment = await Enrollment.findOne({
          student: req.student._id,
          course: courseId,
        }).populate("course", "title slug thumbnail price accessType");

        if (!enrollment) {
          return res.json({
            success: true,
            enrolled: false,
            paymentStatus: "not_submitted",
            enrollment: null,
          });
        }

        return res.json({
          success: true,
          enrolled: enrollment.paymentStatus === "approved",
          paymentStatus: enrollment.paymentStatus,
          enrollment,
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
  );
};
