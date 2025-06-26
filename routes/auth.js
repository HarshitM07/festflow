const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 🔍 Optional test route to confirm connection
router.get('/test', (req, res) => {
  res.send('✅ Auth route working!');
});

router.post('/register', async (req, res) => {
  console.log('📩 Request body:', req.body); // Add this line

  const { name, email, password, role, clubName } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      clubName: role === 'admin' ? clubName : null
    });

    await user.save();
    res.status(201).json({ message: 'Registered successfully!' });

  } catch (err) {
    console.error('❌ Registration Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// @route    POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // ✅ Store user in session
    req.session.user = {
      id: user._id,
      name: user.name,
      role: user.role,
      clubName: user.clubName
    };

    // ✅ Redirect based on role
    if (user.role === 'admin') {
      res.redirect('/admin/my-events');
    } else {
      res.redirect('/events-page');
    }

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



module.exports = router; // ✅ Only once at the end
