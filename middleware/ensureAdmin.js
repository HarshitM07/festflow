module.exports = function ensureAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login'); // Or res.status(403).send('Forbidden')
  }
  next();
};
