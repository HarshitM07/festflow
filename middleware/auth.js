module.exports = (req, res, next) => {
  // Check if user session exists
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Unauthorized: Please log in first' });
  }

  // Attach user info from session to req.user
  req.user = {
    userId: req.session.user.id,
    role: req.session.user.role,
    name: req.session.user.name
  };

  next();
};
