const { model, Schema } = require("mongoose");
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
    resetPass: { type: String },
    likedMovies: [{ type: Schema.Types.ObjectId, ref: "Movie", default: [] }],
  },
  { timestamps: true },
);
module.exports = model("User", userSchema);