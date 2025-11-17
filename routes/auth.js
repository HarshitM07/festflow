const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// POST /register  (normal user signup only)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.redirect('/register?error=Email+already+registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'USER',           // user cannot choose role
      club: null,             // only coordinators have a club
      mustChangePassword: false
    });

    return res.redirect('/login?success=1');
  } catch (err) {
    console.error('Registration error:', err);
    return res.redirect('/register?error=Server+error+during+registration');
  }
});

// POST /login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate('club');
    if (!user) {
      return res.redirect('/login?error=Invalid+credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.redirect('/login?error=Invalid+credentials');
    }

    // Build JWT payload
    const payload = {
      userId: user._id.toString(),
      role: user.role,
      clubId: user.club ? user.club._id.toString() : null,
      mustChangePassword: user.mustChangePassword || false
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    // Set JWT in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // If user is required to change password, force that flow
    if (user.mustChangePassword) {
      return res.redirect('/change-password');
    }

    // Normal redirects based on role
    if (user.role === 'SUPER_ADMIN') {
      return res.redirect('/superadmin/dashboard');
    }

    if (user.role === 'COORDINATOR') {
      return res.redirect('/admin/my-events');
    }

    // Default for normal users
    return res.redirect('/events-page');
  } catch (err) {
    console.error('Login error:', err);
    return res.redirect('/login?error=Server+error+during+login');
  }
});

// POST /logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.redirect('/login');
});

// GET change password form
router.get('/change-password', requireAuth, (req, res) => {
  // You can read ?error=... from query in the EJS if needed
  res.render('change-password');
});

// POST change password
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(400).send('User not found');

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.redirect('/change-password?error=Current+password+incorrect');
    }

    if (newPassword !== confirmPassword) {
      return res.redirect('/change-password?error=Passwords+do+not+match');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    const payload = {
      userId: user._id.toString(),
      role: user.role,
      clubId: user.club ? user.club.toString() : null,
      mustChangePassword: false
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    if (user.role === 'SUPER_ADMIN') return res.redirect('/superadmin/dashboard');
    if (user.role === 'COORDINATOR') return res.redirect('/admin/my-events');
    return res.redirect('/events-page');
  } catch (err) {
    console.error('Change Password Error:', err);
    return res.redirect('/change-password?error=Server+error+while+changing+password');
  }
});

module.exports = router;
