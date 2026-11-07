require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const userModel = require("../models/user.model");

async function run() {
  const targetEmail = process.argv[2]?.trim().toLowerCase();

  try {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      console.error("❌ Xatolik: MONGO_URL aniqlanmagan!");
      process.exit(1);
    }

    await mongoose.connect(mongoUrl);
    console.log("✅ MongoDB ga ulandi.");

    if (targetEmail) {
      const user = await userModel.findOne({ email: targetEmail });
      if (!user) {
        console.log(`⚠️ Foydalanuvchi topilmadi: ${targetEmail}`);
        console.log("Mavjud barcha foydalanuvchilar:");
        const all = await userModel.find().select("name email role");
        console.table(all.map(u => ({ id: u._id.toString(), name: u.name, email: u.email, role: u.role })));
      } else {
        user.role = "admin";
        user.isBanned = false;
        await user.save();
        console.log(`🎉 Foydalanuvchi muvaffaqiyatli ADMIN qilindi:`);
        console.log(`- Ism:   ${user.name}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Rol:   ${user.role}`);
      }
    } else {
      console.log("ℹ️ Foydalanuvchilar ro'yxati:");
      const all = await userModel.find().select("name email role isBanned");
      console.table(all.map(u => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        isBanned: u.isBanned
      })));
      console.log("\nFoydalanish: node scripts/make-admin.js <email>");
    }
  } catch (err) {
    console.error("❌ Xatolik:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
