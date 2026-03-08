const { model, Schema } = require("mongoose");
const movieSchema = new Schema({
  adult: { type: Boolean },
  backdrop_path: { type: String, required: true },
  poster_path: { type: String, required: true },
  release_date: { type: String, required: true },
  genre_ids: { type: Array },
  video: { type: Boolean },
  id: Number,
  original_language: { type: String },
  original_title: { type: String },
  overview: { type: String },
  title: { type: String },
  popularity: Number,
  vote_average: Number,
  vote_count: Number,
});
module.exports = model("SavedMovie", movieSchema);