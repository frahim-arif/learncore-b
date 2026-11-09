
const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["free", "upi_qr"],
      default: "upi_qr",
    },

    paymentStatus: {
      type: String,
      enum: ["not_required", "pending", "approved", "rejected"],
      default: "pending",
    },

    transactionId: {
      type: String,
      default: "",
      trim: true,
    },

    paymentScreenshot: {
      type: String,
      default: "",
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

enrollmentSchema.index(
  { student: 1, course: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.Enrollment ||
  mongoose.model("Enrollment", enrollmentSchema);
