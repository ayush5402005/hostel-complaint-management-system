const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB Connected");

    const existing = await User.findOne({ email: "admin_10@hostel.com" });
    if (existing) {
      console.log("Admin already exists!");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("Admin_10@123", 10);

    await User.create({
      name: "Super Admin",
      email: "admin_10@hostel.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("✅ Admin created successfully!");
    process.exit();

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

seedAdmin();
