// controllers/googleCalendarController.js
const User = require('../models/User');
const { syncEvents } = require('../services/googleCalendarService');

exports.syncGoogleCalendar = async (req, res) => {
  try {
    const token = req.headers['x-auth-token']; // Get the token from the request headers
    console.log('Received token in googleCalendarController:', token);

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', user);

    const syncedEvents = await syncEvents(user, token);
    res.status(200).json({ message: 'Google Calendar synced successfully', syncedEvents });
  } catch (error) {
    console.error('Error syncing Google Calendar:', error);
    res.status(500).json({ message: 'Failed to sync Google Calendar', error: error.message });
  }
};
