# TODO: Fix Code Displaying on Home Page

- [x] Install ejs package
- [x] Create views/ directory
- [x] Move index.html to views/index.ejs
- [x] Move annonce.html to views/annonce.ejs
- [x] Move profil.html to views/profil.ejs
- [x] Move ajouter.html to views/ajouter.ejs
- [x] Move login.html to views/login.ejs
- [x] Move register.html to views/register.ejs
- [x] Update server.js to configure view engine to 'ejs' and views path to './views'
- [x] Update annonceRoutes.js to use res.render for /ajouter
- [x] Update authRoutes.js to use res.render for /login and /register
- [x] Test server to ensure pages render correctly

# TODO: Fix Image Upload Directory

- [x] Create public/images directory for multer uploads
- [ ] Test image upload functionality

# TODO: Add Edit and Delete Functionality

- [x] Create edit.ejs view for editing annonces
- [x] Update annonceRoutes.js to render edit page
- [x] Update annonceController.js to handle image deletion on delete
- [x] Update profil.ejs to improve delete confirmation message
- [ ] Test edit and delete functionality

# TODO: Add Admin Dashboard

- [x] Add role field to User model
- [x] Update login controller to set userRole in session and redirect admins to /admin
- [x] Create adminAuth middleware
- [x] Create adminController with dashboard, manageUsers, manageAnnonces, deleteUser, deleteAnnonceAdmin
- [x] Create adminRoutes with protected routes
- [x] Update server.js to include adminRoutes
- [x] Create admin.ejs, admin-users.ejs, admin-annonces.ejs views
- [x] Seed admin user: mouhamadn63@gmail.com / admin123@
- [x] Test admin features
