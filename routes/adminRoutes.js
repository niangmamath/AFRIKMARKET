const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');
const upload = require('../middleware/upload');

router.get('/admin', auth, adminAuth, adminController.getAdminDashboard);
router.get('/admin/users', auth, adminAuth, adminController.getAllUsers);
router.get('/admin/annonces', auth, adminAuth, adminController.getAllAnnonces);
router.post('/admin/users/:id/delete', auth, adminAuth, adminController.deleteUser);
router.post('/admin/annonces/:id/delete', auth, adminAuth, adminController.deleteAnnonceAdmin);
router.post('/admin/annonces/:id/approve', auth, adminAuth, adminController.approveAnnonce);
router.post('/admin/annonces/:id/reject', auth, adminAuth, adminController.rejectAnnonce);

// Blog routes
router.get('/admin/blogs', auth, adminAuth, adminController.getAllBlogs);
router.get('/admin/blogs/create', auth, adminAuth, adminController.getCreateBlog);
router.post('/admin/blogs/create', auth, adminAuth, upload.single('image'), adminController.createBlog);
router.get('/admin/blogs/:id/edit', auth, adminAuth, adminController.getEditBlog);
router.post('/admin/blogs/:id/edit', auth, adminAuth, upload.single('image'), adminController.updateBlog);
router.post('/admin/blogs/:id/delete', auth, adminAuth, adminController.deleteBlog);

module.exports = router;
