
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

const studentAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Student login required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const student = await Student.findById(decoded.id);

    if (!student || student.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Student account is inactive or blocked",
      });
    }

    req.student = student;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired student token",
    });
  }
};

module.exports = studentAuth;
