const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

// 🔗 Routes
const eventRoutes = require('./routes/event');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

// 🔍 Models
const Event = require('./models/Event');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Set EJS as View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Middlewares
app.use(cors());
// ✅ Routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ✅ Sessions with MongoDB
app.use(session({
  secret: process.env.SESSION_SECRET || 'festflowsecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 6, // 6 hours
    secure: false // set true only in HTTPS
  }
}));
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/admin', adminRoutes);
// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));



// ✅ Test Home
app.get('/', (req, res) => {
  res.send('FestFlow API is running 🚀');
});

// ✅ Events Page (GET with filtering and sorting)
app.get('/events-page', async (req, res) => {
  try {
    const { festType, clubName, sortBy } = req.query;

    let query = {};
    if (festType) query.festType = festType;

    let events = await Event.find(query).populate('createdBy', 'name clubName');

    if (clubName) {
      const search = clubName.toLowerCase();
      events = events.filter(event =>
        event.createdBy.clubName?.toLowerCase().includes(search)
      );
    }

    if (sortBy === 'festType') {
      events.sort((a, b) => a.festType.localeCompare(b.festType));
    } else if (sortBy === 'clubName') {
      events.sort((a, b) => {
        const nameA = a.createdBy.clubName?.toLowerCase() || '';
        const nameB = b.createdBy.clubName?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      });
    } else if (sortBy === 'both') {
      events.sort((a, b) => {
        const festComp = a.festType.localeCompare(b.festType);
        if (festComp !== 0) return festComp;
        const nameA = a.createdBy.clubName?.toLowerCase() || '';
        const nameB = b.createdBy.clubName?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      });
    }

    res.render('index', { events });
  } catch (err) {
    console.error('🔥 Error loading events:', err.message);
    res.status(500).send('Error loading events');
  }
});

// ✅ Login View (GET)
app.get('/login', (req, res) => {
  res.render('login'); // Make sure login.ejs exists
});

// ✅ Admin Dashboard View
app.get('/admin', (req, res) => {
  res.render('admin'); // Make sure admin.ejs exists
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
