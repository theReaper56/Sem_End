const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all internships
router.get('/', async (req, res) => {
  try {
    const [internships] = await db.query('SELECT * FROM internships ORDER BY start_date DESC');
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
      company, 
      location, 
      start_date, 
      duration, 
      category, 
      description, 
      requirements 
    } = req.body;
    
    // Validate required fields
    if (!title || !company || !location || !duration || !category) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    
    const [result] = await db.query(
      `INSERT INTO internships 
      (title, company, location, start_date, duration, category, description, requirements) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, company, location, start_date, duration, category, description, requirements]
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