const { model, Schema } = require("mongoose");
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
    },
    avatar: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
    resetPass: { type: String },
    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },
    providerId: { type: String, default: null },
    likedMovie: [{ type: Schema.Types.ObjectId, ref: "Movie" }],
    savedMovie: [{ type: Schema.Types.ObjectId, ref: "SavedMovie" }],
  },
  { timestamps: true },
);
module.exports = model("User", userSchema);