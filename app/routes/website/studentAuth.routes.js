
const jwt = require("jsonwebtoken");
const Student = require("../../models/Student");

module.exports = (server) => {
  // STUDENT LOGIN
  server.post("/api/student/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and password are required",
        });
      }

      const student = await Student.findOne({
        username: username.trim().toLowerCase(),
      }).select("+password");

      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password",
        });
      }

      if (student.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Your student account is inactive or blocked",
        });
      }

      const isMatch = await student.comparePassword(password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password",
        });
      }

      const token = jwt.sign(
        {
          id: student._id,
          role: "student",
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      student.lastLogin = new Date();
      await student.save();

      return res.json({
        success: true,
        message: "Student login successful",
        token,
        student: {
          id: student._id,
          name: student.name,
          username: student.username,
          email: student.email,
          phone: student.phone,
          status: student.status,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // STUDENT PROFILE
  server.get(
    "/api/student/profile",
    require("../../middleware/studentAuth"),
    async (req, res) => {
      try {
        const student = await Student.findById(req.student._id)
          .select("-password")
          .populate("enrolledCourses", "title slug thumbnail price");

        return res.json({
          success: true,
          student,
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
