const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/user");

module.exports = (server) => {
  // REGISTER
  server.post("/api/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!email || !password) {
        return res.json({
          success: false,
          message: "Email aur password required hai",
        });
      }

      const oldUser = await User.findOne({ email });

      if (oldUser) {
        return res.json({
          success: false,
          message: "Ye email already registered hai",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
      });

      res.json({
        success: true,
        message: "Register successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      res.json({
        success: false,
        message: err.message,
      });
    }
  });

  // LOGIN
  server.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.json({
          success: false,
          message: "Email aur password required hai",
        });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.json({
          success: false,
          message: "User nahi mila",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.json({
          success: false,
          message: "Password galat hai",
        });
      }

      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      res.json({
        success: false,
        message: err.message,
      });
    }
  });
};