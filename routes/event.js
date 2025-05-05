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

// Register for an event (requires user authentication)
router.post('/:id/register', async (req, res) => {
  // Check if user is authenticated
  if (!req.session.user) {
    return res.status(401).json({ error: 'Please sign in to register for events' });
  }

  try {
    const eventId = req.params.id;
    const userId = req.session.user.id;

    // Check if event exists
    const [events] = await db.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is already registered
    const [existingRegistrations] = await db.query(
      'SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (existingRegistrations.length > 0) {
      return res.status(400).json({ error: 'You are already registered for this event' });
    }

    // Register user for the event
    await db.query(
      'INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)',
      [eventId, userId]
    );

    res.status(201).json({ message: 'Successfully registered for the event' });
  } catch (error) {
    console.error('Error registering for event:', error);
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