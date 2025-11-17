const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const token = req.cookies.token;

  // No token found
  if (!token) {
    return res.status(401).send('Unauthorized: Please log in first');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user data to req.user
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      clubId: decoded.clubId || null,
      mustChangePassword: decoded.mustChangePassword || false
    };

    return next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);

    // Clear invalid token
    res.clearCookie('token');

    return res.status(401).send('Unauthorized: Invalid or expired token');
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // requireAuth should run before this middleware
    if (!req.user) {
      return res.status(401).send('Unauthorized');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).send('Forbidden: You do not have permission');
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
