const express = require('express');
const path = require('path');
const session = require('express-session');
const dotenv = require('dotenv');
const db = require('./config/db');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Serve static files
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));
app.use('/css', express.static(path.join(__dirname, 'frontend/css')));
app.use('/webpages', express.static(path.join(__dirname, 'frontend/webpages')));

// Import routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/event');
const internshipRoutes = require('./routes/internship');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/internships', internshipRoutes);

// Route protection middleware
app.use((req, res, next) => {
  // Protect admin routes
  if (req.path.startsWith('/admin') && !req.session.admin) {
    return res.redirect('/webpages/Admin.html');
  }
  
  // Protect user routes
  if (req.path.startsWith('/webpages') && !req.session.user) {
    return res.redirect('/webpages/Signin.html');
  }
  
  next();
});

// Root route
app.get('/', (req, res) => {
  res.redirect('/webpages/homepage.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});