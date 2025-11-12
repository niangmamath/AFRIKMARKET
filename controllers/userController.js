const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = new User({ name, email, password });
    await user.save();
    req.session.userId = user._id;
    res.redirect('/');
  } catch (error) {
    res.status(400).send('Erreur lors de l\'inscription: ' + error.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).send('Email ou mot de passe incorrect');
    }
    req.session.userId = user._id;
    req.session.userRole = user.role;
    if (user.role === 'admin') {
      res.redirect('/admin');
    } else {
      res.redirect('/');
    }
  } catch (error) {
    res.status(500).send('Erreur lors de la connexion');
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render('profil', { user });
  } catch (error) {
    res.status(500).send('Erreur');
  }
};
