const { model, Schema } = require("mongoose");

const movieSchema = new Schema(
  {
    adult: { type: Boolean, default: false },
    backdrop_path: { type: String, default: "" },
    poster_path: { type: String, default: "" },
    release_date: { type: String, default: "" },
    genre_ids: { type: Array, default: [] },
    video: { type: Boolean, default: false },
    id: { type: Number, required: true },
    original_language: { type: String, default: "" },
    original_title: { type: String, default: "" },
    overview: { type: String, default: "" },
    title: { type: String, default: "" },
    popularity: { type: Number, default: 0 },
    vote_average: { type: Number, default: 0 },
    vote_count: { type: Number, default: 0 },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Bitta foydalanuvchi bir xil filmni qayta-qayta like qilmasligi uchun unikal compound index
movieSchema.index({ userId: 1, id: 1 }, { unique: true });

module.exports = model("Movie", movieSchema);
