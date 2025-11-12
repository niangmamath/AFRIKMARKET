const adminAuth = (req, res, next) => {
  if (req.session.userRole !== 'admin') {
    return res.status(403).send('Accès refusé. Administrateur requis.');
  }
  next();
};

module.exports = adminAuth;
