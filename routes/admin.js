const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

// Helper: check if current user can manage this event
function canManageEvent(event, user) {
  if (!user) return false;

  // Super admin can manage everything
  if (user.role === 'SUPER_ADMIN') return true;

  // Coordinators can manage:
  // 1) Events of their own club OR
  // 2) Events they created (fallback)
  if (user.role === 'COORDINATOR') {
    const sameClub =
      user.clubId && event.club && event.club.toString() === user.clubId.toString();

    const isCreator =
      event.createdBy && event.createdBy.toString() === user.userId.toString();

    return sameClub || isCreator;
  }

  return false;
}



// My Events Page
router.get(
  '/my-events',
  requireAuth,
  requireRole('COORDINATOR', 'SUPER_ADMIN'),
  async (req, res) => {
    try {
      let query = {};

      if (req.user.role === 'COORDINATOR') {
        // coordinator -> events for their club
        query.club = req.user.clubId;
      } else if (req.user.role === 'SUPER_ADMIN') {
        // super admin -> all events
        query = {};
      }

      const events = await Event.find(query)
        .populate('club', 'name')
        .populate('createdBy', 'name');

      res.render('my-events', { events });
    } catch (err) {
      console.error('Failed to load my events:', err);
      res.status(500).send('Server error');
    }
  }
);

// View Registrants Page
router.get(
  '/events/:id/registrations',
  requireAuth,
  requireRole('COORDINATOR', 'SUPER_ADMIN'),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id)
        .populate('registrations', 'name email')
        .populate('club', 'name');

      if (!event) return res.status(404).send('Event not found');

      if (!canManageEvent(event, req.user)) {
        return res.status(403).send('Forbidden');
      }

      res.render('view-registrations', { event });
    } catch (err) {
      console.error('Failed to load registrations:', err);
      res.status(500).send('Server error');
    }
  }
);

// Add Event Form (GET)
router.get(
  '/add-event',
  requireAuth,
  requireRole('COORDINATOR', 'SUPER_ADMIN'),
  async (req, res) => {
    let clubs = [];

    if (req.user.role === 'SUPER_ADMIN') {
      const Club = require('../models/Club');
      clubs = await Club.find({}, 'name'); // fetch club names for dropdown
    }

    res.render('add-event', { clubs });
  }
);


// Add Event Handler (POST)
router.post(
  '/add-event',
  requireAuth,
  requireRole('COORDINATOR', 'SUPER_ADMIN'),
  async (req, res) => {
    try {
      const { title, description, date, festType, registrationDeadline, clubId } = req.body;

      let eventClubId = null;

      if (req.user.role === 'COORDINATOR') {
        // coordinator can only create for their own club
        eventClubId = req.user.clubId;
      } else if (req.user.role === 'SUPER_ADMIN') {
        // super admin should specify club explicitly (via form)
        eventClubId = clubId;
      }

      if (!eventClubId) {
        return res.status(400).send('Club not specified for event');
      }

      const newEvent = new Event({
        title,
        description,
        date,
        festType,
        registrationDeadline,
        createdBy: req.user.userId,
        club: eventClubId
      });

      await newEvent.save();
      res.redirect('/admin/my-events');
    } catch (err) {
      console.error('Failed to create event:', err);
      res.status(500).send('Server Error');
    }
  }
);

// Edit Event Form (GET)
router.get(
  '/events/:id/edit',
  requireAuth,
  requireRole('COORDINATOR', 'SUPER_ADMIN'),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id).populate('club', 'name');
      if (!event) return res.status(404).send('Event not found');

      if (!canManageEvent(event, req.user)) {
        return res.status(403).send('Forbidden');
      }

      res.render('edit-event', { event });
    } catch (err) {
      console.error('Edit GET Error:', err);
      res.status(500).send('Server error');
    }
  }
);

// Edit Event Handler (POST)
router.post(
  '/events/:id/edit',
  requireAuth,
  requireRole('COORDINATOR', 'SUPER_ADMIN'),
  async (req, res) => {
    try {
      const { title, description, date, festType, registrationDeadline } = req.body;

      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).send('Event not found');

      if (!canManageEvent(event, req.user)) {
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
      console.error('Edit POST Error:', err);
      res.status(500).send('Server error');
    }
  }
);

// QR Check-In Page
router.get(
  '/check-in',
  requireAuth,
  requireRole('COORDINATOR', 'SUPER_ADMIN'),
  async (req, res) => {
    const { eventId } = req.query;

    if (!eventId) {
      // you can replace this with a better UX later
      return res.redirect('/admin/my-events');
    }

    try {
      const event = await Event.findById(eventId)
        .populate('registrations', 'name email')
        .populate('club', 'name');

      if (!event) return res.status(404).send('Event not found');

      if (!canManageEvent(event, req.user)) {
        return res.status(403).send('Unauthorized');
      }

      res.render('admin-checkin', { event });
    } catch (err) {
      console.error('QR Check-in Page Error:', err);
      res.status(500).send('Server error');
    }
  }
);

// Redirect QR route to the original one that shows registrations
router.get(
  '/event/:id/registrants',
  requireAuth,
  requireRole('COORDINATOR', 'SUPER_ADMIN'),
  async (req, res) => {
    res.redirect(`/admin/events/${req.params.id}/registrations`);
  }
);

module.exports = router;
