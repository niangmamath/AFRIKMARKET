const express = require('express');
const path = require('path');
const router = express.Router();
const annonceController = require('../controllers/annonceController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', annonceController.getAllAnnonces);
router.get('/annonces', annonceController.getAnnoncesPage);

router.get('/annonce/:id', annonceController.getAnnonce);

router.get('/ajouter', auth, (req, res) => {
  res.render('ajouter', { user: req.session.userId });
});

router.post('/ajouter', auth, upload.array('images', 5), annonceController.createAnnonce);

router.get('/profil', auth, annonceController.getUserAnnonces);

router.get('/edit/:id', auth, async (req, res) => {
  const Annonce = require('../models/Annonce');
  const annonce = await Annonce.findById(req.params.id);
  if (!annonce || annonce.user.toString() !== req.session.userId) {
    return res.status(403).send('Non autorisé');
  }
  res.render('edit', { annonce, user: req.session.userId });
});

router.post('/edit/:id', auth, upload.array('images', 5), annonceController.updateAnnonce);

router.post('/delete/:id', auth, annonceController.deleteAnnonce);

router.post('/like/:id', auth, annonceController.likeAnnonce);

router.post('/comment/:id', auth, annonceController.addComment);

module.exports = router;
