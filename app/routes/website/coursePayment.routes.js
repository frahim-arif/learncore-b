
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const Course = require("../../models/Course");
const Enrollment = require("../../models/Enrollment");
const studentAuth = require("../../middleware/studentAuth");

const router = express.Router();

const uploadDir = path.join(
  process.cwd(),
  "uploads",
  "course-payments"
);

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const filename =
      Date.now() + "-" + crypto.randomBytes(6).toString("hex") +
      path.extname(file.originalname).toLowerCase();

    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG and WEBP images are allowed"));
    }

    cb(null, true);
  },
});

// GET COURSE PAYMENT INFORMATION
router.get(
  "/courses/:courseId/payment-info",
  studentAuth,
  async (req, res) => {
    try {
      const course = await Course.findOne({
        _id: req.params.courseId,
        isPublished: true,
      }).select("title price accessType");

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      if (course.accessType === "free" || course.price <= 0) {
        return res.status(400).json({
          success: false,
          message: "This course does not require payment",
        });
      }

      const existing = await Enrollment.findOne({
        student: req.student._id,
        course: course._id,
      });

      return res.json({
        success: true,
        course: {
          id: course._id,
          title: course.title,
          amount: course.price,
        },
        upiId: "9058596626@ptsbi",
        qrImage: "/images/upi-qr.png",
        paymentStatus: existing?.paymentStatus || "not_submitted",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// SUBMIT UPI PAYMENT
router.post(
  "/submit",
  studentAuth,
  upload.single("screenshot"),
  async (req, res) => {
    try {
      const { courseId, transactionId } = req.body;

      if (!courseId || !transactionId || !req.file) {
        return res.status(400).json({
          success: false,
          message: "Course, transaction ID and payment screenshot are required",
        });
      }

      if (!/^[a-zA-Z0-9_-]{6,40}$/.test(transactionId.trim())) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid UTR / Transaction ID",
        });
      }

      const course = await Course.findOne({
        _id: courseId,
        isPublished: true,
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      if (course.accessType === "free" || course.price <= 0) {
        return res.status(400).json({
          success: false,
          message: "This course does not require payment",
        });
      }

      const existing = await Enrollment.findOne({
        student: req.student._id,
        course: courseId,
      });

      if (existing?.paymentStatus === "approved") {
        return res.status(409).json({
          success: false,
          message: "You are already enrolled in this course",
        });
      }

      if (existing?.paymentStatus === "pending") {
        return res.status(409).json({
          success: false,
          message: "Your payment is already submitted and awaiting verification",
        });
      }

      const duplicateUTR = await Enrollment.findOne({
        transactionId: transactionId.trim(),
        _id: { $ne: existing?._id || null },
      });

      if (duplicateUTR) {
        return res.status(409).json({
          success: false,
          message: "This transaction ID has already been submitted",
        });
      }

      const screenshotPath =
        "/uploads/course-payments/" + req.file.filename;

      let enrollment;

      if (existing) {
        existing.amount = course.price;
        existing.paymentMethod = "upi_qr";
        existing.paymentStatus = "pending";
        existing.transactionId = transactionId.trim();
        existing.paymentScreenshot = screenshotPath;
        existing.approvedAt = null;
        enrollment = await existing.save();
      } else {
        enrollment = await Enrollment.create({
          student: req.student._id,
          course: course._id,
          amount: course.price,
          paymentMethod: "upi_qr",
          paymentStatus: "pending",
          transactionId: transactionId.trim(),
          paymentScreenshot: screenshotPath,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Payment submitted successfully. Awaiting admin verification.",
        enrollment: {
          id: enrollment._id,
          course: course.title,
          amount: enrollment.amount,
          transactionId: enrollment.transactionId,
          paymentStatus: enrollment.paymentStatus,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);



module.exports = (server) => {
  server.use("/api/student/payment", router);
};


