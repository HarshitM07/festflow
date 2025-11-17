const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const sendQRMail = require('../utils/sendQRMail');
const { requireAuth, requireRole } = require('../middleware/auth');

// Helper: event management permission
function canManageEvent(event, user) {
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.role === 'COORDINATOR' && user.clubId && event.club) {
    return event.club.toString() === user.clubId.toString();
  }
  return false;
}

// Create Event (only coordinator or super admin)
router.post(
  '/',
  requireAuth,
  requireRole('COORDINATOR', 'SUPER_ADMIN'),
  async (req, res) => {
    try {
      const { title, description, date, festType, registrationDeadline, clubId } = req.body;

      let finalClubId = null;

      if (req.user.role === 'COORDINATOR') {
        finalClubId = req.user.clubId;
      } else if (req.user.role === 'SUPER_ADMIN') {
        if (!clubId) {
          return res.status(400).json({ error: 'clubId required for SUPER_ADMIN event creation' });
        }
        finalClubId = clubId;
      }

      const event = await Event.create({
        title,
        description,
        date,
        festType,
        registrationDeadline,
        createdBy: req.user.userId,
        club: finalClubId,
      });

      return res.status(201).json({ message: 'Event created', event });
    } catch (err) {
      console.error('Create Event Error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Get All Events (public)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'name')
      .populate('club', 'name');
    res.json(events);
  } catch (err) {
    console.error('Fetch Events Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register for Event (only USER)
router.post('/:id/register', requireAuth, requireRole('USER'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.registrations.includes(req.user.userId)) {
      return res.status(400).json({ error: 'Already registered' });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ error: 'Registration deadline passed' });
    }

    event.registrations.push(req.user.userId);
    await event.save();

    const user = await User.findById(req.user.userId);

    try {
      await sendQRMail(user, event);
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr.message);
    }

    res.json({ message: 'Registered successfully. QR email sent!' });
  } catch (err) {
    console.error('Event Registration Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Coordinator / Admin Event List (JSON)
router.get('/my-events', requireAuth, requireRole('COORDINATOR', 'SUPER_ADMIN'), async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'COORDINATOR') query.club = req.user.clubId;
    
    const events = await Event.find(query);
    res.json(events);
  } catch (err) {
    console.error('Fetch My Events Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Event By ID (public view)
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy')
      .populate('club', 'name');
      
    if (!event) return res.status(404).send('Event not found');

    res.render('eventDetails', { event });
  } catch (err) {
    console.error('Event Fetch Error:', err);
    res.status(500).send('Server error');
  }
});

// Check-In via QR (COORDINATOR or SUPER_ADMIN)
router.post(
  '/:eventId/check-in',
  requireAuth,
  requireRole('COORDINATOR', 'SUPER_ADMIN'),
  async (req, res) => {
    try {
      const { userId } = req.body;
      const event = await Event.findById(req.params.eventId);

      if (!event) return res.status(404).json({ error: 'Event not found' });

      if (!canManageEvent(event, req.user)) {
        return res.status(403).json({ error: 'Unauthorized action' });
      }

      if (!event.registrations.includes(userId)) {
        return res.status(400).json({ error: 'User not registered' });
      }

      if (event.checkedInUsers.includes(userId)) {
        return res.status(400).json({ error: 'User already checked in' });
      }

      event.checkedInUsers.push(userId);
      await event.save();

      res.json({ message: 'User checked in successfully!' });
    } catch (err) {
      console.error('Check-In Error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
