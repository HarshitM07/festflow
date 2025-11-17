const express = require('express');
const router = express.Router();

// Landing page
router.get('/', (req, res) => {
  // currentUser is already in res.locals from server.js JWT middleware
  res.render('landing', {
    user: res.locals.currentUser || null
  });
});

module.exports = router;
