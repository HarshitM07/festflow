const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Routes
const indexRoutes = require('./routes/index');
const eventRoutes = require('./routes/event');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const superadminRoutes = require('./routes/superadmin');

// Middleware
const { requireAuth, requireRole } = require('./middleware/auth');

// Models
const Event = require('./models/Event');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Extract user from JWT (if available) and store in res.locals for EJS
app.use((req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    res.locals.currentUser = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.locals.currentUser = decoded; // { userId, role, clubId, mustChangePassword }
  } catch (err) {
    res.locals.currentUser = null;
    // clear invalid token
    res.clearCookie('token');
  }

  next();
});

// Make query params available in all EJS views as `query`
app.use((req, res, next) => {
  res.locals.query = req.query || {};
  next();
});

// Route Mounting
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/admin', adminRoutes);
app.use('/superadmin', superadminRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Public Events Page
app.get('/events-page', async (req, res) => {
  try {
    const { festType, clubName, view } = req.query;
    const now = new Date();

    let query = {};

    if (festType) query.festType = festType;

    // Upcoming vs Past logic
    if (view === 'past') {
      // History page: only past events
      query.registrationDeadline = { $lt: now };
    } else {
      // Default: only upcoming / open events
      query.registrationDeadline = { $gte: now };
    }

    let events = await Event.find(query)
      .populate('createdBy', 'name club')
      .populate('club', 'name');

    if (clubName) {
      const search = clubName.toLowerCase();
      events = events.filter(event =>
        event.club?.name?.toLowerCase().includes(search)
      );
    }

    res.render('index', {
      events,
      user: res.locals.currentUser,
      isPast: view === 'past'
    });
  } catch (err) {
    console.error('Error loading events:', err.message);
    res.status(500).send('Error loading events');
  }
});



// Views for login & register
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));

// Admin Views (protected)
app.get('/admin', requireAuth, requireRole('COORDINATOR', 'SUPER_ADMIN'), (req, res) => {
  res.render('admin');
});

app.get('/admin/check-in', requireAuth, requireRole('COORDINATOR', 'SUPER_ADMIN'), (req, res) => {
  res.render('admin-checkin');
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
