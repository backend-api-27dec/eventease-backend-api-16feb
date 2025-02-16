const { google } = require('googleapis');
const Event = require('../models/Event');

exports.syncEvents = async (user, token) => {
  console.log('Received user in syncEvents:', user);

  if (!user.googleAccessToken || !user.googleRefreshToken) {
    throw new Error('Missing Google access or refresh token');
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  });

  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      user.googleRefreshToken = tokens.refresh_token;
    }
    user.googleAccessToken = tokens.access_token;
    user.save(); // Save updated tokens
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  console.log('Google Calendar API initialized');

  try {
    const events = await Event.find({ user: user._id });
    console.log('Events fetched from database:', events);

    const promises = events.map(async (event) => {
      const googleEvent = {
        summary: event.title,
        description: event.description,
        start: { dateTime: event.date.toISOString(), timeZone: 'UTC' },
        end: { dateTime: new Date(new Date(event.date).getTime() + event.duration * 60 * 1000).toISOString(), timeZone: 'UTC' },
        attendees: event.participants,
      };

      let createdEvent;
      if (event.googleEventId) {
        createdEvent = await calendar.events.update({
          calendarId: 'primary',
          eventId: event.googleEventId,
          resource: googleEvent,
        });
      } else {
        createdEvent = await calendar.events.insert({
          calendarId: 'primary',
          resource: googleEvent,
        });
        event.googleEventId = createdEvent.data.id;
        await event.save();
      }

      console.log('Google Calendar event created/updated:', createdEvent.data);
      return createdEvent.data;
    });

    const results = await Promise.all(promises);
    console.log('All promises resolved');
    return results;
  } catch (error) {
    console.error('Error syncing with Google Calendar:', error);

    if (error.code === 403) {
      console.error('Insufficient Permission: Ensure the token has the correct scopes');
    }

    throw error;
  }
};
