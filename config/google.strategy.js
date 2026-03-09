const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const userModel = require("../models/user.model");
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) return done(new Error("Google email topilmadi"));
        let user = await userModel.findOne({ email });
        if (!user) {
          user = await userModel.create({
            name: profile.displayName || "Google User",
            email,
            provider: "google",
            providerId: profile.id,
            avatar: profile.photos?.[0]?.value,
          });
        } else if (!user.providerId) {
          user.provider = "google";
          user.providerId = profile.id;
          if (!user.avatar && profile.photos?.[0]?.value) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
        }
        return done(null, user)
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);