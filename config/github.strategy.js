const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const userModel = require("../models/user.model");
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email =
          profile.emails?.[0].value ||
          `${profile.username}@users.noreply.github.com`;
        let user = await userModel.findOne({ email });
        if (!user) {
          user = await userModel.create({
            name: profile.displayName || profile.username || "GitHub User",
            email,
            provider: "github",
            providerId: profile.id,
            avatar: profile.photos?.[0]?.value,
          });
        } else if (!user.providerId) {
          user.provider = "github";
          user.providerId = profile.id;
          if (!user.avatar && profile.photos?.[0]?.value) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);