const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/auth');
const { sendWelcomeEmail } = require('./mailer');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://eventease-backend-api-16feb.onrender.com/api/auth/google/callback",
  passReqToCallback: true
},
async (req, accessToken, refreshToken, profile, done) => {
  console.log('GoogleStrategy callback executed');
  console.log('🔹 Received accessToken:', accessToken);
  console.log('🔹 Received refreshToken:', refreshToken || '❌ Not received');

  try {
    let user = await User.findOne({ googleId: profile.id });
    console.log('User lookup:', user);

    if (!user) {
      user = new User({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        role: 'user',
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken
      });
      await user.save();
      console.log('✅ New user created:', user);
    } else {
      user.googleAccessToken = accessToken;
      if (refreshToken) { // Only update if refreshToken is provided
        user.googleRefreshToken = refreshToken;
      }
      await user.save();
      console.log('✅ User updated with new tokens:', user);
    }

    return done(null, user);
  } catch (err) {
    console.error('❌ Error in GoogleStrategy:', err);
    return done(err, false);
  }
}
    const payload = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    const jwtToken = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
    user.token = jwtToken;

    console.log('Generated JWT token:', jwtToken);

    sendWelcomeEmail(user, req);

    return done(null, user);
  } catch (err) {
    console.error('Error in GoogleStrategy:', err);
    return done(err, false);
  }
}
));

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log('Deserializing user with id:', id);
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
