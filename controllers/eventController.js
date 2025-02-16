// eventController.js
const Event = require('../models/Event');
const User = require('../models/User');
    
exports.createEvent = async (req, res) => {
    const { title, description, participants, date, time, duration, sessionNotes } = req.body;
    const user = req.user._id;

    console.log('Creating event with user:', user);
    console.log('Received event data:', { title, description, participants, date, time, duration, sessionNotes });

    try {
        const event = new Event({
            title,  
            description,
            participants,
            date,
            time,
            duration,
            sessionNotes,
            user
        });

        await event.save();
        console.log('Event successfully saved to database:', event);
        res.status(201).json({ success: true, event });
    } catch (error) {
        console.error('Error creating event:', error.message);
        res.status(500).json({ success: false, error: error.message || 'Failed to create event' });
    }
};

exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find({ user: req.user._id });
        console.log('Events fetched for user:', req.user._id, events);
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

exports.updateEvent = async (req, res) => {
    const { id } = req.params;
    const { title, description, participants, date, time, duration, sessionNotes } = req.body;

    try {
        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        event.title = title;
        event.description = description;
        event.participants = participants;
        event.date = date;
        event.time = time;
        event.duration = duration;
        event.sessionNotes = sessionNotes;

        await event.save();
        console.log('Event updated:', event);
        res.status(200).json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
};

exports.deleteEvent = async (req, res) => {
    const { id } = req.params;

    try {
        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await event.deleteOne(); // Use deleteOne() method to remove the document
        console.log('Event deleted:', event);
        res.status(200).json({ message: 'Event deleted' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};

