const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const authenticate = require('../middleware/auth');
const ensureAdmin = require('../middleware/ensureAdmin');

// ✅ My Events Page
router.get('/my-events', ensureAdmin, async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.session.user.id })
                              .populate('createdBy', 'clubName');
    res.render('my-events', { events });
  } catch (err) {
    console.error('❌ Failed to load my events:', err);
    res.status(500).send('Server error');
  }
});

// ✅ View Registrants Page
router.get('/events/:id/registrations', ensureAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
                             .populate('registrations', 'name email');
    if (!event) return res.status(404).send('Event not found');

    if (event.createdBy.toString() !== req.session.user.id) {
      return res.status(403).send('Forbidden');
    }

    res.render('view-registrations', { event });
  } catch (err) {
    console.error('❌ Failed to load registrations:', err);
    res.status(500).send('Server error');
  }
});

// ✅ Add Event Form (GET)
router.get('/add-event', ensureAdmin, (req, res) => {
  res.render('add-event');
});

// ✅ Add Event Handler (POST)
router.post('/add-event', ensureAdmin, async (req, res) => {
  try {
    const { title, description, date, festType, registrationDeadline } = req.body;

    const newEvent = new Event({
      title,
      description,
      date,
      festType,
      registrationDeadline,
      createdBy: req.session.user.id
    });

    await newEvent.save();
    res.redirect('/admin/my-events');
  } catch (err) {
    console.error('❌ Failed to create event:', err);
    res.status(500).send('Server Error');
  }
});

// ✅ Edit Event Form (GET)
router.get('/events/:id/edit', ensureAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send('Event not found');

    if (event.createdBy.toString() !== req.session.user.id) {
      return res.status(403).send('Forbidden');
    }

    res.render('edit-event', { event });
  } catch (err) {
    console.error('❌ Edit GET Error:', err);
    res.status(500).send('Server error');
  }
});

// ✅ Edit Event Handler (POST)
router.post('/events/:id/edit', ensureAdmin, async (req, res) => {
  try {
    const { title, description, date, festType, registrationDeadline } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send('Event not found');

    if (event.createdBy.toString() !== req.session.user.id) {
      return res.status(403).send('Forbidden');
    }

    event.title = title;
    event.description = description;
    event.date = date;
    event.festType = festType;
    event.registrationDeadline = registrationDeadline;

    await event.save();
    res.redirect('/admin/my-events');
  } catch (err) {
    console.error('❌ Edit POST Error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
