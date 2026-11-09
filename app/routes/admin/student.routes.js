
const Student = require("../../models/Student");
const adminAuth = require("../../middleware/adminAuth");

module.exports = (server) => {

  // CREATE STUDENT
  server.post("/api/admin/students", adminAuth, async (req, res) => {
    try {
      const { name, username, email, phone, password } = req.body;

      if (!name || !username || !password) {
        return res.status(400).json({
          success: false,
          message: "Name, username and password are required",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters",
        });
      }

      const existing = await Student.findOne({
        username: username.trim().toLowerCase(),
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Username already exists",
        });
      }

      const student = await Student.create({
        name,
        username,
        email,
        phone,
        password,
      });

      res.status(201).json({
        success: true,
        message: "Student created successfully",
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
      console.error("Create Student:", error);

      res.status(500).json({
        success: false,
        message: "Unable to create student",
      });
    }
  });


  // GET ALL STUDENTS
  server.get("/api/admin/students", adminAuth, async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const search = req.query.search || "";

      const filter = {};

      if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        filter.$or = [
          { name: { $regex: safeSearch, $options: "i" } },
          { username: { $regex: safeSearch, $options: "i" } },
          { email: { $regex: safeSearch, $options: "i" } },
          { phone: { $regex: safeSearch, $options: "i" } },
        ];
      }

      if (req.query.status) {
        filter.status = req.query.status;
      }

      const total = await Student.countDocuments(filter);

      const students = await Student.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      res.json({
        success: true,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        students,
      });

    } catch (error) {
      console.error("Get Students:", error);

      res.status(500).json({
        success: false,
        message: "Unable to fetch students",
      });
    }
  });


  // GET SINGLE STUDENT
  server.get("/api/admin/students/:id", adminAuth, async (req, res) => {
    try {
      const student = await Student.findById(req.params.id)
        .select("-password")
        .populate("enrolledCourses", "title slug thumbnail");

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      res.json({
        success: true,
        student,
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }
  });


  // UPDATE STUDENT
  server.put("/api/admin/students/:id", adminAuth, async (req, res) => {
    try {
      const { name, username, email, phone, password } = req.body;

      const student = await Student.findById(req.params.id);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      if (username) {
        const existing = await Student.findOne({
          username: username.trim().toLowerCase(),
          _id: { $ne: student._id },
        });

        if (existing) {
          return res.status(409).json({
            success: false,
            message: "Username already exists",
          });
        }

        student.username = username;
      }

      if (name !== undefined) student.name = name;
      if (email !== undefined) student.email = email;
      if (phone !== undefined) student.phone = phone;

      if (password) {
        if (password.length < 8) {
          return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters",
          });
        }

        student.password = password;
      }

      await student.save();

      res.json({
        success: true,
        message: "Student updated successfully",
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
      console.error("Update Student:", error);

      res.status(500).json({
        success: false,
        message: "Unable to update student",
      });
    }
  });


  // CHANGE STUDENT STATUS
  server.patch("/api/admin/students/:id/status", adminAuth, async (req, res) => {
    try {
      const { status } = req.body;

      if (!["active", "inactive", "blocked"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid student status",
        });
      }

      const student = await Student.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      ).select("-password");

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      res.json({
        success: true,
        message: "Student status updated successfully",
        student,
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Unable to update student status",
      });
    }
  });

};
