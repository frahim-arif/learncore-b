
const mongoose = require("mongoose");

const Enrollment = require("../../models/Enrollment");
const Student = require("../../models/Student");
const Course = require("../../models/Course");
const adminAuth = require("../../middleware/adminAuth");

module.exports = (server) => {
  // GET ALL ENROLLMENTS
  server.get("/api/admin/enrollments", adminAuth, async (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const filter = {};

      if (
        status &&
        ["pending", "approved", "rejected", "not_required"].includes(status)
      ) {
        filter.paymentStatus = status;
      }

      const pageNumber = Math.max(1, Number(page) || 1);
      const limitNumber = Math.min(100, Math.max(1, Number(limit) || 20));

      const [enrollments, total] = await Promise.all([
        Enrollment.find(filter)
          .populate("student", "name username email phone")
          .populate("course", "title slug price")
          .sort({ createdAt: -1 })
          .skip((pageNumber - 1) * limitNumber)
          .limit(limitNumber),

        Enrollment.countDocuments(filter),
      ]);

      return res.json({
        success: true,
        total,
        page: pageNumber,
        pages: Math.ceil(total / limitNumber),
        enrollments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET SINGLE ENROLLMENT
  server.get(
    "/api/admin/enrollments/:id",
    adminAuth,
    async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid enrollment ID",
          });
        }

        const enrollment = await Enrollment.findById(id)
          .populate("student", "name username email phone")
          .populate("course", "title slug price");

        if (!enrollment) {
          return res.status(404).json({
            success: false,
            message: "Enrollment not found",
          });
        }

        return res.json({
          success: true,
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

  // APPROVE PAYMENT
  server.patch(
    "/api/admin/enrollments/:id/approve",
    adminAuth,
    async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid enrollment ID",
          });
        }

        const enrollment = await Enrollment.findById(id);

        if (!enrollment) {
          return res.status(404).json({
            success: false,
            message: "Enrollment not found",
          });
        }

        if (enrollment.paymentStatus !== "pending") {
          return res.status(400).json({
            success: false,
            message: "Only pending payments can be approved",
          });
        }

        const course = await Course.findById(enrollment.course);

        if (!course || !course.isPublished) {
          return res.status(400).json({
            success: false,
            message: "Course not found or not published",
          });
        }

        if (Number(enrollment.amount) !== Number(course.price)) {
          return res.status(400).json({
            success: false,
            message: "Payment amount does not match current course price",
          });
        }

        enrollment.paymentStatus = "approved";
        enrollment.approvedAt = new Date();

        await enrollment.save();

        // Update student's enrolled course list
        await Student.findByIdAndUpdate(enrollment.student, {
          $addToSet: {
            enrolledCourses: enrollment.course,
          },
        });

        return res.json({
          success: true,
          message: "Payment approved. Course access granted.",
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

  // REJECT PAYMENT
  server.patch(
    "/api/admin/enrollments/:id/reject",
    adminAuth,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid enrollment ID",
          });
        }

        const enrollment = await Enrollment.findById(id);

        if (!enrollment) {
          return res.status(404).json({
            success: false,
            message: "Enrollment not found",
          });
        }

        if (enrollment.paymentStatus !== "pending") {
          return res.status(400).json({
            success: false,
            message: "Only pending payments can be rejected",
          });
        }

        enrollment.paymentStatus = "rejected";
        enrollment.approvedAt = null;

        await enrollment.save();

        return res.json({
          success: true,
          message: "Payment rejected",
          reason: reason || null,
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
