const express = require('express');
const { syncGoogleCalendar } = require('../controllers/googleCalendarController');
const protect = require('../middleware/authMiddleware'); 
const router = express.Router();

router.use(protect); // Ensure authentication before handling requests

router.post('/sync', async (req, res) => {
  console.log('----------------------------');
  console.log('🔵 Received request in googleCalendarRoutes');

  try {
    // Log request headers to verify token presence
    console.log('🟡 Request Headers:', req.headers);
    
    // Extract the token from the request headers
    const token = req.header('x-auth-token');
    
    if (!token) {
      console.error('❌ No token provided in headers');
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('✅ Token extracted from headers:', token);
    
    // Call the syncGoogleCalendar function and pass the token
    await syncGoogleCalendar(req, res, token);

  } catch (error) {
    console.error('🚨 Error in googleCalendarRoutes:', error);
    res.status(500).json({ message: 'Failed to sync Google Calendar', error: error.message });
  }
});

module.exports = router;
