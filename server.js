const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const path = require('path');
const indexRoutes = require('./routes/index');

// 🔗 Routes
const eventRoutes = require('./routes/event');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const ensureAdmin = require('./middleware/ensureAdmin');

// 🔍 Models
const Event = require('./models/Event');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'festflowsecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 6,
    secure: false
  }
}));

// ✅ Flash messages
app.use(flash());

// ✅ Inject flash messages globally into all EJS views
app.use((req, res, next) => {
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

// ✅ Routes
app.use('/', indexRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/admin', adminRoutes);

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {console.error('❌ MongoDB connection error:', err);
        process.exit(1);});

// ✅ Public routes


app.get('/events-page', async (req, res) => {
  try {
    const { festType, clubName } = req.query;
    let query = {};
    if (festType) query.festType = festType;

    let events = await Event.find(query).populate('createdBy', 'name clubName');

    if (clubName) {
      const search = clubName.toLowerCase();
      events = events.filter(event =>
        event.createdBy.clubName?.toLowerCase().includes(search)
      );
    }

    res.render('index', {
      events,
      currentUserId: req.session.userId || null,
      user: {
        role: req.session.role || null
      }
    });
  } catch (err) {
    console.error('🔥 Error loading events:', err.message);
    res.status(500).send('Error loading events');
  }
});

// ✅ Auth-related views
app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

// ✅ Admin views
app.get('/admin', ensureAdmin, (req, res) => {
  res.render('admin');
});

app.get('/admin/check-in', ensureAdmin, (req, res) => {
  res.render('admin-checkin');
});

// ✅ Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

