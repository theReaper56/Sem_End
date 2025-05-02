const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all internships
router.get('/', async (req, res) => {
  try {
    const [internships] = await db.query('SELECT * FROM internships ORDER BY deadline DESC');
    res.json(internships);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific internship by ID
router.get('/:id', async (req, res) => {
  try {
    const [internships] = await db.query('SELECT * FROM internships WHERE id = ?', [req.params.id]);
    
    if (internships.length === 0) {
      return res.status(404).json({ error: 'Internship not found' });
    }
    
    res.json(internships[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new internship (Admin only)
router.post('/', async (req, res) => {
  // Check if user is authenticated as admin
  if (!req.session.admin) {
    return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
  }
  
  try {
    const { 
      title, 
      description,
      company, 
      location, 
      category, 
      duration, 
      stipend,
      deadline
    } = req.body;
    
    // Validate required fields
    if (!title || !company || !location || !category || !duration || !deadline) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    
    // Validate category is one of the enum values
    const validCategories = ['software_development', 'data_science', 'design', 'marketing', 'finance', 'operations'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be one of: ' + validCategories.join(', ') });
    }
    
    // Validate deadline is a valid date
    if (isNaN(Date.parse(deadline))) {
      return res.status(400).json({ error: 'Invalid deadline date format' });
    }
    
    const [result] = await db.query(
      `INSERT INTO internships 
      (title, description, company, location, category, duration, stipend, deadline) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, company, location, category, duration, stipend, deadline]
    );
    
    res.status(201).json({ 
      message: 'Internship created successfully',
      internshipId: result.insertId
    });
  } catch (error) {
    console.error('Error creating internship:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update an internship (Admin only)
router.put('/:id', async (req, res) => {
  if (!req.session.admin) {
    return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
  }
  
  try {
    const { 
      title, 
      description,
      company, 
      location, 
      category, 
      duration, 
      stipend,
      deadline
    } = req.body;
    
    // Validate required fields
    if (!title || !company || !location || !category || !duration || !deadline) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    
    // Validate category is one of the enum values
    const validCategories = ['software_development', 'data_science', 'design', 'marketing', 'finance', 'operations'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be one of: ' + validCategories.join(', ') });
    }
    
    const [result] = await db.query(
      `UPDATE internships SET 
        title = ?, 
        description = ?, 
        company = ?, 
        location = ?, 
        category = ?, 
        duration = ?, 
        stipend = ?, 
        deadline = ?
      WHERE id = ?`,
      [title, description, company, location, category, duration, stipend, deadline, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Internship not found' });
    }
    
    res.json({ message: 'Internship updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an internship (Admin only)
router.delete('/:id', async (req, res) => {
  if (!req.session.admin) {
    return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
  }
  
  try {
    const [result] = await db.query('DELETE FROM internships WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Internship not found' });
    }
    
    res.json({ message: 'Internship deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;