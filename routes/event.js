const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const authenticate = require('../middleware/auth');
const sendQRMail = require('../utils/sendQRMail');
const User = require('../models/User');

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

// ✅ Register for Event (user only) + Send QR Email
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

    const user = await User.findById(req.user.userId);
    console.log(`📧 Sending email to ${user.email}...`);

    try {
      await sendQRMail(user, event);
      console.log(`✅ Email sent to ${user.email}`);
    } catch (emailErr) {
      console.error('❌ Email send error:', emailErr.message);
    }

    res.json({ message: 'Registered successfully and email sent!' });
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

// ✅ Get Event by ID (for rendering or API)
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy');
    if (!event) return res.status(404).send('Event not found');

    res.render('eventDetails', { event }); // Optional
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).send('Server Error');
  }
});

// ✅ Admin Check-In via QR
router.post('/:eventId/check-in', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can perform check-in' });
    }

    const { userId } = req.body;
    const event = await Event.findById(req.params.eventId);

    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (!event.registrations.includes(userId)) {
      return res.status(400).json({ error: 'User not registered for this event' });
    }

    event.checkedInUsers = event.checkedInUsers || [];

    if (event.checkedInUsers.includes(userId)) {
      return res.status(400).json({ error: 'User already checked in' });
    }

    event.checkedInUsers.push(userId);
    await event.save();

    res.json({ message: '✅ User checked in successfully!' });
  } catch (err) {
    console.error('❌ Check-In Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
