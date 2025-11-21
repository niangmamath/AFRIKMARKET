const Annonce = require('../models/Annonce');
const cloudinary = require('cloudinary').v2;

// Helper function to extract public_id from Cloudinary URL
function getPublicId(url) {
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    const publicIdWithExt = parts.slice(uploadIndex + 1).join('/');
    return publicIdWithExt.split('.')[0]; // Remove file extension
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
}

exports.getAllAnnonces = async (req, res) => {
  try {
    const { search, category, location } = req.query;
    let query = { status: 'approved' }; // Only show approved annonces
    if (search) query.title = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    if (location) query.location = { $regex: location, $options: 'i' };
    const annonces = await Annonce.find(query).populate('user', 'name').sort({ createdAt: -1 }); // Sort by newest first
    res.render('index', { annonces: annonces || [], user: req.session.userId });
  } catch (error) {
    // If DB error, render with empty annonces
    res.render('index', { annonces: [], user: req.session.userId });
  }
};

exports.getAnnoncesPage = async (req, res) => {
  try {
    const { search, category, location } = req.query;
    let query = { status: 'approved' }; // Only show approved annonces
    if (search) query.title = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    if (location) query.location = { $regex: location, $options: 'i' };
    const annonces = await Annonce.find(query).populate('user', 'name');
    res.render('annonces', { annonces: annonces || [], user: req.session.userId });
  } catch (error) {
    // If DB error, render with empty annonces
    res.render('annonces', { annonces: [], user: req.session.userId });
  }
};

exports.getAnnonce = async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id)
      .populate('user', 'name')
      .populate('comments.user', 'name')
      .populate('likes', 'name');
    if (!annonce) return res.status(404).send('Annonce non trouvée');

    const userId = req.session.userId;
    const isLiked = userId && annonce.likes.some(like => like._id.toString() === userId.toString());
    const canLike = userId && annonce.user._id.toString() !== userId.toString();

    res.render('annonce', {
      annonce,
      user: userId,
      isLiked: !!isLiked,
      canLike: !!canLike,
      likeCount: annonce.likes.length
    });
  } catch (error) {
    // If DB error, send error message
    res.status(500).send('Erreur');
  }
};

exports.createAnnonce = async (req, res) => {
  try {
    const { title, description, price, category, location } = req.body;
    const images = req.files ? req.files.map(file => file.path) : [];
    const annonce = new Annonce({
      title,
      description,
      price,
      category,
      location,
      images,
      user: req.session.userId,
    });
    await annonce.save();
    res.redirect('/');
  } catch (error) {
    res.status(400).send('Erreur lors de la création: ' + error.message);
  }
};

exports.updateAnnonce = async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce || annonce.user.toString() !== req.session.userId) {
      return res.status(403).send('Non autorisé');
    }
    const { title, description, price, category, location } = req.body;
    annonce.title = title;
    annonce.description = description;
    annonce.price = price;
    annonce.category = category;
    annonce.location = location;
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      if (annonce.images && annonce.images.length > 0) {
        for (const imageUrl of annonce.images) {
          const publicId = getPublicId(imageUrl);
          if (publicId) {
            try {
              await cloudinary.uploader.destroy(publicId);
            } catch (error) {
              console.error('Error deleting old image from Cloudinary:', error);
            }
          }
        }
      }
      // Set new images
      annonce.images = req.files.map(file => file.path);
    }
    await annonce.save();
    res.redirect('/annonce/' + annonce._id);
  } catch (error) {
    res.status(500).send('Erreur');
  }
};

exports.deleteAnnonce = async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce || annonce.user.toString() !== req.session.userId) {
      return res.status(403).send('Non autorisé');
    }
    // Delete associated images from Cloudinary
    if (annonce.images && annonce.images.length > 0) {
      for (const imageUrl of annonce.images) {
        const publicId = getPublicId(imageUrl);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (error) {
            console.error('Error deleting image from Cloudinary:', error);
          }
        }
      }
    }
    await Annonce.findByIdAndDelete(req.params.id);
    res.redirect('/profil');
  } catch (error) {
    res.status(500).send('Erreur');
  }
};

exports.getUserAnnonces = async (req, res) => {
  try {
    const annonces = await Annonce.find({ user: req.session.userId });
    res.render('profil', { annonces: annonces || [], user: req.session.userId });
  } catch (error) {
    // If DB error, render with empty annonces
    res.render('profil', { annonces: [], user: req.session.userId });
  }
};

exports.likeAnnonce = async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce) return res.status(404).json({ error: 'Annonce non trouvée' });

    // Prevent user from liking their own annonce
    if (annonce.user.toString() === req.session.userId.toString()) {
      return res.status(403).json({ error: 'Vous ne pouvez pas liker votre propre annonce' });
    }

    const userId = req.session.userId;
    const isLiked = annonce.likes.includes(userId);

    if (isLiked) {
      // Unlike
      annonce.likes = annonce.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Like
      annonce.likes.push(userId);
    }

    await annonce.save();
    res.json({ likes: annonce.likes.length, isLiked: !isLiked });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce) return res.status(404).json({ error: 'Annonce non trouvée' });

    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Le commentaire ne peut pas être vide' });
    }

    const comment = {
      user: req.session.userId,
      text: text.trim(),
      createdAt: new Date(),
    };

    annonce.comments.push(comment);
    await annonce.save();

    // Populate the new comment for response
    const populatedAnnonce = await Annonce.findById(req.params.id)
      .populate('comments.user', 'name');

    const newComment = populatedAnnonce.comments[populatedAnnonce.comments.length - 1];

    res.json({
      comment: {
        _id: newComment._id,
        user: { name: newComment.user.name },
        text: newComment.text,
        createdAt: newComment.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
