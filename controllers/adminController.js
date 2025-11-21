const User = require('../models/User');
const Annonce = require('../models/Annonce');
const Blog = require('../models/Blog');

exports.getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAnnonces = await Annonce.countDocuments();
    const pendingAnnonces = await Annonce.countDocuments({ status: 'pending' });
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
    const recentAnnonces = await Annonce.find({ status: 'approved' }).populate('user', 'name').sort({ createdAt: -1 }).limit(5);

    res.render('admin', {
      totalUsers,
      totalAnnonces,
      pendingAnnonces,
      recentUsers,
      recentAnnonces,
      user: req.session.userId
    });
  } catch (error) {
    res.status(500).send('Erreur lors du chargement du dashboard admin');
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.render('admin-users', { users, user: req.session.userId });
  } catch (error) {
    res.status(500).send('Erreur lors du chargement des utilisateurs');
  }
};

exports.getAllAnnonces = async (req, res) => {
  try {
    const annonces = await Annonce.find().populate('user', 'name');
    res.render('admin-annonces', { annonces, user: req.session.userId });
  } catch (error) {
    res.status(500).send('Erreur lors du chargement des annonces');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    // Prevent admin from deleting themselves
    if (userId === req.session.userId) {
      return res.status(400).send('Vous ne pouvez pas vous supprimer vous-même');
    }
    await User.findByIdAndDelete(userId);
    res.redirect('/admin/users');
  } catch (error) {
    res.status(500).send('Erreur lors de la suppression de l\'utilisateur');
  }
};

exports.deleteAnnonceAdmin = async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce) {
      return res.status(404).send('Annonce non trouvée');
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
    res.redirect('/admin/annonces');
  } catch (error) {
    res.status(500).send('Erreur lors de la suppression de l\'annonce');
  }
};

exports.approveAnnonce = async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce) {
      return res.status(404).send('Annonce non trouvée');
    }

    annonce.status = 'approved';
    await annonce.save();
    res.redirect('/admin/annonces');
  } catch (error) {
    res.status(500).send('Erreur lors de l\'approbation de l\'annonce');
  }
};

exports.rejectAnnonce = async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce) {
      return res.status(404).send('Annonce non trouvée');
    }

    annonce.status = 'rejected';
    annonce.adminComment = req.body.comment || '';
    await annonce.save();
    res.redirect('/admin/annonces');
  } catch (error) {
    res.status(500).send('Erreur lors du rejet de l\'annonce');
  }
};

// Blog management functions
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().populate('author', 'name').sort({ createdAt: -1 });
    res.render('admin-blogs', { blogs, user: req.session.userId });
  } catch (error) {
    res.status(500).send('Erreur lors du chargement des blogs');
  }
};

exports.getCreateBlog = (req, res) => {
  res.render('create-blog', { user: req.session.userId });
};

exports.createBlog = async (req, res) => {
  try {
    const { title, content, excerpt, tags, status } = req.body;
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    const image = req.file ? `/images/${req.file.filename}` : '';

    const blog = new Blog({
      title,
      content,
      excerpt,
      author: req.session.userId,
      tags: tagsArray,
      status,
      image,
    });

    await blog.save();
    res.redirect('/admin/blogs');
  } catch (error) {
    res.status(500).send('Erreur lors de la création du blog');
  }
};

exports.getEditBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).send('Blog non trouvé');
    }
    res.render('edit-blog', { blog, user: req.session.userId });
  } catch (error) {
    res.status(500).send('Erreur lors du chargement du blog');
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { title, content, excerpt, tags, status } = req.body;
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).send('Blog non trouvé');
    }

    blog.title = title;
    blog.content = content;
    blog.excerpt = excerpt;
    blog.tags = tagsArray;
    blog.status = status;

    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (blog.image) {
        const publicId = getPublicId(blog.image);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (error) {
            console.error('Error deleting old image from Cloudinary:', error);
          }
        }
      }
      blog.image = req.file.path;
    }

    await blog.save();
    res.redirect('/admin/blogs');
  } catch (error) {
    res.status(500).send('Erreur lors de la mise à jour du blog');
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).send('Blog non trouvé');
    }

    // Delete associated image
    if (blog.image) {
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../public', blog.image);
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting image:', err);
      });
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.redirect('/admin/blogs');
  } catch (error) {
    res.status(500).send('Erreur lors de la suppression du blog');
  }
};
