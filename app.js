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
  secret: process.env.SESSION_SECRET || 'your_fallback_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));
app.use('/css', express.static(path.join(__dirname, 'frontend/css')));
app.use('/webpages', express.static(path.join(__dirname, 'frontend/webpages')));

// Auth middleware to protect routes
const authMiddleware = (req, res, next) => {
  // Public pages that don't require authentication
  const publicPages = [
    '/webpages/homepage.html',
    '/webpages/Signup.html',
    '/webpages/Signin.html',
    '/webpages/Admin.html'
  ];
  
  // Check if the requested path is a protected page
  if (!publicPages.includes(req.path)) {
    // Admin pages
    if (req.path.includes('admin-') && !req.session.admin) {
      return res.redirect('/webpages/Admin.html?error=Please login as admin');
    }
    
    // User dashboard and other protected pages
    if (req.path.includes('dashboard') && !req.session.user) {
      return res.redirect('/webpages/Signin.html?error=Please login to continue');
    }
  }
  
  next();
};

// Apply auth middleware to webpages
app.use('/webpages', authMiddleware);

// Import routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/event');
const internshipRoutes = require('./routes/internship');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/internships', internshipRoutes);

// Root route
app.get('/', (req, res) => {
  res.redirect('/webpages/homepage.html');
});

// Define routes for sign-in and sign-up for better navigation
app.get('/signin', (req, res) => {
  res.redirect('/webpages/Signin.html');
});

app.get('/signup', (req, res) => {
  res.redirect('/webpages/Signup.html');
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