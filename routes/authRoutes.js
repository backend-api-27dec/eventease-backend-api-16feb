const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const passport = require('passport');
require('../config/passport');

    
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events'] }));
console.log('Received request from Google');

router.get('/google/callback', (req, res, next) => {
    console.log('Received callback from Google');
    next();
}, passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    console.log('Google authentication successful, redirecting to dashboard');
    const token = req.user.token; // Retrieve token from authenticated user

    // Redirect to dashboard with user details and token in URL
    res.redirect(`https://event-ease-nine.vercel.app/?user=${encodeURIComponent(JSON.stringify(req.user))}&token=${token}`);
});


router.get('/verify-token', authMiddleware, (req, res) => {
    res.json({ valid: true });
});

module.exports = router;
