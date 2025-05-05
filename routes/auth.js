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
    req.session.user = {
      id: newUser[0].id,
      name: newUser[0].name,
      email: newUser[0].email
    };
    
    res.redirect('/webpages/homepage.html');
    
  } catch (error) {
    console.error('Registration error:', error);
    res.redirect('/webpages/Signup.html?error=Registration failed');
  }
});

// User Login
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.redirect('/webpages/Signin.html?error=Email and password are required');
    }

    // Find user
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
	console.log(users.length);
    
    if (users.length === 0) {
      return res.redirect('/webpages/Signup.html?error=Invalid credentials');
    }

    // Verify password
    else
    {
        const isValidPassword = await bcrypt.compare(password, users[0].password);
        if (!isValidPassword) {
          return res.redirect('/webpages/Signin.html?error=Invalid credentials');
        }

        // Set session with only necessary user data (avoid storing password in session)
        req.session.user = {
          id: users[0].id,
          name: users[0].name,
          email: users[0].email
        };
        
        res.redirect('/webpages/homepage.html');
	}

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

	else
	{
		// Verify password
		var isValidPassword = await bcrypt.compare(password, admins[0].password);
		if (!isValidPassword) {
			console.log(isValidPassword);
			return res.redirect('/webpages/Admin.html?error=Invalid credentials');  
		}

		// Set admin session (only store necessary data)
		req.session.admin = {
		id: admins[0].id,
		username: admins[0].username
		};
		
		res.redirect('/frontend/webpages/admin_dashboard.html');
	}

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

// Check auth status endpoint
router.get('/check-auth', (req, res) => {
  if (req.session.user) {
    return res.json({ authenticated: true, user: req.session.user });
  }
  return res.json({ authenticated: false });
});

// Admin management routes
router.get('/admin/list', async (req, res) => {
  try {
    // Check if the current user is an admin
    if (!req.session.admin) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Get all admins
    const [admins] = await db.query(
      'SELECT id, username FROM admins'
    );
    
    // Add isCurrent flag to identify the current admin
    const adminsWithCurrentFlag = admins.map(admin => ({
      ...admin,
      isCurrent: admin.id === req.session.admin.id
    }));
    
    res.json(adminsWithCurrentFlag);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

router.post('/admin/add', async (req, res) => {
  try {
    // Check if the current user is an admin
    if (!req.session.admin) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if admin already exists
    const [existingAdmins] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (existingAdmins.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new admin
    await db.query(
      'INSERT INTO admins (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );
    
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

router.delete('/admin/:id', async (req, res) => {
  try {
    // Check if the current user is an admin
    if (!req.session.admin) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const adminId = req.params.id;

    // Prevent deleting self
    if (adminId === req.session.admin.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete admin
    await db.query('DELETE FROM admins WHERE id = ?', [adminId]);
    
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

module.exports = router;