const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all events
router.get('/', async (req, res) => {
  try {
    const [events] = await db.query('SELECT * FROM events ORDER BY date DESC');
    res.json(events);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific event by ID
router.get('/:id', async (req, res) => {
  try {
    const [events] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(events[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new event (Admin only)
router.post('/', async (req, res) => {
  // Check if user is authenticated as admin
  if (!req.session.admin) {
    return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
  }
  
  try {
    const { title, description, date, location, category } = req.body;
    
    // Validate required fields
    if (!title || !description || !date || !location || !category) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const [result] = await db.query(
      `INSERT INTO events 
      (title, description, date, location, category) 
      VALUES (?, ?, ?, ?, ?)`,
      [title, description, date, location, category]
    );
    
    res.status(201).json({ 
      message: 'Event created successfully',
      eventId: result.insertId
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete an event (Admin only)
router.delete('/:id', async (req, res) => {
  if (!req.session.admin) {
    return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
  }
  
  try {
    const [result] = await db.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;