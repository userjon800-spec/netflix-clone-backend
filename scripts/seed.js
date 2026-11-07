require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userModel = require("../models/user.model");

async function seed() {
  try {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      console.error("❌ Xatolik: .env faylida MONGO_URL aniqlanmagan!");
      process.exit(1);
    }

    console.log("⏳ MongoDB ga ulanmoqda...");
    await mongoose.connect(mongoUrl);
    console.log("✅ MongoDB ga muvaffaqiyatli ulandi.");

    // Admin mavjudligini tekshirish
    const existingAdmin = await userModel.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log(`ℹ️ Tizimda admin mavjud: ${existingAdmin.email} (${existingAdmin.name})`);
    } else {
      console.log("🌱 Standart Admin yaratilmoqda...");
      const hashedPassword = await bcrypt.hash("Admin123!Password", 10);
      const adminUser = await userModel.create({
        name: "Netflix SuperAdmin",
        email: "admin@netflix.com",
        password: hashedPassword,
        role: "admin",
        provider: "local",
        avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      });

      console.log("🎉 Standart Admin yaratildi!");
      console.log("-----------------------------------------");
      console.log(`Email:    admin@netflix.com`);
      console.log(`Parol:    Admin123!Password`);
      console.log(`ID:       ${adminUser._id}`);
      console.log("-----------------------------------------");
    }

    console.log("✅ Seeding jarayoni yakunlandi.");
  } catch (error) {
    console.error("❌ Seeding xatosi:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
