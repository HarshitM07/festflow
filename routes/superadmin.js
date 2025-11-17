const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const { requireAuth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Club = require('../models/Club');

function generatePassword(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

// GET Super Admin Dashboard (very simple for now)
router.get(
  '/dashboard',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  async (req, res) => {
    const clubs = await Club.find().populate('coordinator', 'name email');
    const coordinators = await User.find({ role: 'COORDINATOR' }).populate('club', 'name');

    res.render('superadmin-dashboard', {
      clubs,
      coordinators
    });
  }
);

// POST Create Club
router.post(
  '/clubs',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  async (req, res) => {
    try {
      const { name, description } = req.body;

      await Club.create({
        name,
        description
      });

      res.redirect('/superadmin/dashboard');
    } catch (err) {
      console.error('Create Club Error:', err);
      res.status(500).send('Server error');
    }
  }
);

// POST Create Coordinator for a club
router.post(
  '/coordinators',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  async (req, res) => {
    try {
      const { name, email, clubId } = req.body;

      const club = await Club.findById(clubId);
      if (!club) {
        return res.status(400).send('Invalid club');
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).send('User with this email already exists');
      }

      const plainPassword = generatePassword();
      const hashed = await bcrypt.hash(plainPassword, 10);

      const coordinator = await User.create({
        name,
        email,
        password: hashed,
        role: 'COORDINATOR',
        club: club._id,
        mustChangePassword: true
      });

      club.coordinator = coordinator._id;
      await club.save();

      // You can render a special page showing the initial password
      res.render('show-initial-password', {
        email,
        password: plainPassword,
        clubName: club.name
      });
    } catch (err) {
      console.error('Create Coordinator Error:', err);
      res.status(500).send('Server error');
    }
  }
);

// Approve a club
router.post(
  '/clubs/:id/approve',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  async (req, res) => {
    try {
      await Club.findByIdAndUpdate(req.params.id, { isApproved: true });
      return res.redirect('/superadmin/dashboard');
    } catch (err) {
      console.error('Approve Club Error:', err);
      return res.status(500).send('Server error while approving club');
    }
  }
);


module.exports = router;
