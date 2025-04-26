const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// User Registration
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.redirect('/webpages/Signup.html?error=All fields are required');
    }

    // Check if user already exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.redirect('/webpages/Signup.html?error=Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    
    // Automatically log in after registration
    const [newUser] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    req.session.user = newUser[0];
    
    res.redirect('/webpages/dashboard.html');
    
  } catch (error) {
    console.error('Registration error:', error);
    res.redirect('/webpages/Signup.html?error=Registration failed');
  }
});

// User Login
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("haha", email, password);
    
    // Validate input
    if (!email || !password) {
      return res.redirect('/webpages/Signin.html?error=Email and password are required');
    }

    // Find user
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.redirect('/webpages/Signin.html?error=Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, users[0].password);
    if (!isValidPassword) {
      return res.redirect('/webpages/Signin.html?error=Invalid credentials');
    }

    // Set session
    req.session.user = users[0];
    res.redirect('/webpages/dashboard.html');

  } catch (error) {
    console.error('Login error:', error);
    res.redirect('/webpages/Signin.html?error=Login failed');
  }
});

// Admin Login
router.post('/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.redirect('/webpages/Admin.html?error=Username and password are required');
    }

    // Find admin
    const [admins] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    
    if (admins.length === 0) {
      return res.redirect('/webpages/Admin.html?error=Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admins[0].password);
    if (!isValidPassword) {
      return res.redirect('/webpages/Admin.html?error=Invalid credentials');
    }

    // Set admin session
    req.session.admin = admins[0];
    res.redirect('/webpages/admin-dashboard.html');

  } catch (error) {
    console.error('Admin login error:', error);
    res.redirect('/webpages/Admin.html?error=Login failed');
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/webpages/dashboard.html?error=Logout failed');
    }
    res.clearCookie('connect.sid');
    res.redirect('/webpages/homepage.html');
  });
});

module.exports = router;