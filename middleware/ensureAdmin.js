const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Allow only COORDINATOR or SUPER_ADMIN
    if (decoded.role === 'COORDINATOR' || decoded.role === 'SUPER_ADMIN') {
      req.user = {
        userId: decoded.userId,
        role: decoded.role,
        clubId: decoded.clubId || null
      };
      return next();
    }

    // User is authenticated but does not have access
    return res.status(403).send('Forbidden: Admin access only');

  } catch (err) {
    console.error('JWT verification failed:', err.message);
    res.clearCookie('token');
    return res.redirect('/login');
  }
};
