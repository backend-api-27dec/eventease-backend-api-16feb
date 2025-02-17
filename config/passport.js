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
  passReqToCallback: true,
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
  accessType: 'offline',  // ✅ Request offline access for refresh token
  prompt: 'consent',  // ✅ Ask for re-consent each time
  approval_prompt: 'force' // ✅ Forces Google to reissue a refresh token
},
async (req, accessToken, refreshToken, profile, done) => {
  console.log('🔹 GoogleStrategy callback executed');
  console.log('🔹 Access Token:', accessToken);
  console.log('🔹 Refresh Token:', refreshToken || '❌ Not received');
  console.log('🔹 OAuth Scope:', req.query.scope || '❌ Not available');

  try {
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      // Creating a new user
      user = new User({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        role: 'user',
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken || null
      });
      await user.save();
      console.log('✅ New user created:', user);
    } else {
      // Updating user tokens
      user.googleAccessToken = accessToken;
      if (refreshToken) { 
        user.googleRefreshToken = refreshToken; 
      } else if (!user.googleRefreshToken) {
        console.warn('⚠️ No refresh token received, and user does not have one saved.');
      }
      await user.save();
      console.log('✅ User updated with new tokens:', user);
    }

    // Generate JWT token for authentication
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

    console.log('🔐 Generated JWT token:', jwtToken);

    // Send welcome email after successful authentication
    sendWelcomeEmail(user, req);

    return done(null, user);
  } catch (err) {
    console.error('❌ Error in GoogleStrategy:', err);
    return done(err, false);
  }
}));

// Serialize user for session storage
passport.serializeUser((user, done) => {
  console.log('📝 Serializing user:', user);
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  console.log('🔄 Deserializing user with ID:', id);
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
