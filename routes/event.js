const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all events
router.get('/', async (req, res) => {
  try {
    const [events] = await db.query('SELECT * FROM events');
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new event (Admin only)
router.post('/', async (req, res) => {
  if (!req.session.admin) return res.status(403).send('Unauthorized');
  
  try {
    const { title, description, date, location, category } = req.body;
    await db.query(
      `INSERT INTO events 
      (title, description, date, location, category) 
      VALUES (?, ?, ?, ?, ?)`,
      [title, description, date, location, category]
    );
    res.status(201).json({ message: 'Event created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;