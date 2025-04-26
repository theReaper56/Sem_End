const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all internships
router.get('/', async (req, res) => {
  try {
    const [internships] = await db.query('SELECT * FROM internships');
    res.json(internships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new internship (Admin only)
router.post('/', async (req, res) => {
  if (!req.session.admin) return res.status(403).send('Unauthorized');
  
  try {
    const { title, company, location, start_date, duration, category } = req.body;
    await db.query(
      `INSERT INTO internships 
      (title, company, location, start_date, duration, category) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [title, company, location, start_date, duration, category]
    );
    res.status(201).json({ message: 'Internship created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;