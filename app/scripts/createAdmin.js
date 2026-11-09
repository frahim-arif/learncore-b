
require("dotenv").config();

const mongoose = require("mongoose");
const Admin = require("../models/Admin");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const username = "admin";

    const existingAdmin = await Admin.findOne({ username });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      return;
    }

    const admin = new Admin({
      name: "Super Admin",
      username: username,
      email: "admin@webcorecubetech.com",
      password: "ChangeThis@123",
      role: "super_admin",
      isActive: true,
    });

    await admin.save();

    console.log("✅ Super Admin created successfully");
    console.log("Username: admin");
    console.log("Change the initial password after first login.");
  } catch (error) {
    console.error("❌ Admin Creation Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();


// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhZjFiZmU3ZWE4NWFlMGI5YjMxMmRmNiIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc5NDIyODM4NiwiZXhwIjoxNzk0MzE0Nzg2fQ.MFab5Z8WvLNl6itn_DBIOxqNFTmt0FPaubddnPJrja4