const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// 🔍 Test route
router.get('/test', (req, res) => {
  res.send('✅ Auth route working!');
});

// ✅ Register Handler
router.post('/register', async (req, res) => {
  const { name, email, password, role, clubName } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'Email already registered');
      return res.redirect('/register');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      clubName: role === 'admin' ? clubName : null
    });

    await user.save();
    req.flash('success', 'Registered successfully! Please log in.');
    res.redirect('/login');

  } catch (err) {
    console.error('❌ Registration Error:', err);
    req.flash('error', 'Server error during registration');
    res.redirect('/register');
  }
});

// ✅ Login Handler
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    // ✅ Set session user info
    req.session.user = {
      id: user._id,
      name: user.name,
      role: user.role,
      clubName: user.clubName
    };

    // ✅ Flatten for middleware compatibility
    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.name = user.name;

    return res.redirect(user.role === 'admin' ? '/admin/my-events' : '/events-page');

  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'Server error during login');
    res.redirect('/login');
  }
});


module.exports = router;
