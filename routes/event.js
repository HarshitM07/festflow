const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const authenticate = require('../middleware/auth');

// ✅ Create Event (admin only)
router.post('/', authenticate, async (req, res) => {
  const { title, description, date, festType, registrationDeadline } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create events' });
  }

  try {
    const event = new Event({
      title,
      description,
      date,
      festType,
      registrationDeadline,
      createdBy: req.user.userId
    });

    await event.save();
    res.status(201).json({ message: 'Event created', event });
  } catch (err) {
    console.error('🔥 ERROR:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Get All Events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'name clubName');
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Register for Event (user only)
router.post('/:id/register', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ error: 'Only regular users can register for events' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.registrations.includes(req.user.userId)) {
      return res.status(400).json({ error: 'Already registered' });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ error: 'Registration deadline has passed' });
    }

    event.registrations.push(req.user.userId);
    await event.save();

    res.json({ message: 'Registered successfully!' });
  } catch (err) {
    console.error('🔥 Registration Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Get Admin's Own Events
router.get('/my-events', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can access their events' });
  }

  try {
    const events = await Event.find({ createdBy: req.user.userId });
    res.json(events);
  } catch (err) {
    console.error('❌ Error fetching admin events:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
