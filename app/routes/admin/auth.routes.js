
const Admin = require("../../models/Admin");
const jwt = require("jsonwebtoken");

module.exports = (server) => {
  // Admin Login
  server.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and password are required",
        });
      }

      const admin = await Admin.findOne({
        username: username.toLowerCase().trim(),
      }).select("+password");

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password",
        });
      }

      if (!admin.isActive) {
        return res.status(403).json({
          success: false,
          message: "Admin account is inactive",
        });
      }

      const isMatch = await admin.comparePassword(password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password",
        });
      }

      const token = jwt.sign(
        {
          id: admin._id,
          role: admin.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      admin.lastLogin = new Date();
      await admin.save();

      return res.status(200).json({
        success: true,
        message: "Admin login successful",
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          username: admin.username,
          email: admin.email,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error("Admin Login Error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Admin Profile
  const adminAuth = require("../../middleware/adminAuth");

  server.get("/api/admin/profile", adminAuth, async (req, res) => {
    try {
      return res.json({
        success: true,
        admin: {
          id: req.admin._id,
          name: req.admin.name,
          username: req.admin.username,
          email: req.admin.email,
          role: req.admin.role,
          lastLogin: req.admin.lastLogin,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Unable to fetch admin profile",
      });
    }
  });
};
