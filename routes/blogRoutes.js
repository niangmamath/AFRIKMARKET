const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// Get all published blogs
router.get('/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .populate('author', 'name')
      .sort({ createdAt: -1 });
    res.render('blogs', { blogs });
  } catch (error) {
    res.status(500).send('Erreur lors du chargement des blogs');
  }
});

// Get single blog
router.get('/blog/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name')
      .populate('comments.user', 'name');

    if (!blog || blog.status !== 'published') {
      return res.status(404).send('Blog non trouvé');
    }

    // Increment view count
    blog.views += 1;
    await blog.save();

    res.render('blog-detail', { blog });
  } catch (error) {
    res.status(500).send('Erreur lors du chargement du blog');
  }
});

// Add comment to blog
router.post('/blog/:id/comment', async (req, res) => {
  try {
    const { text } = req.body;
    if (!req.session.userId) {
      return res.status(401).send('Vous devez être connecté pour commenter');
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).send('Blog non trouvé');
    }

    blog.comments.push({
      user: req.session.userId,
      text: text,
    });

    await blog.save();
    res.redirect(`/blog/${blog._id}`);
  } catch (error) {
    res.status(500).send('Erreur lors de l\'ajout du commentaire');
  }
});

// Like/Unlike blog
router.post('/blog/:id/like', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).send('Vous devez être connecté pour liker');
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).send('Blog non trouvé');
    }

    const userIndex = blog.likes.indexOf(req.session.userId);
    if (userIndex > -1) {
      // Unlike
      blog.likes.splice(userIndex, 1);
    } else {
      // Like
      blog.likes.push(req.session.userId);
    }

    await blog.save();
    res.redirect(`/blog/${blog._id}`);
  } catch (error) {
    res.status(500).send('Erreur lors du like');
  }
});

module.exports = router;
