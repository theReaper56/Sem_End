const express = require('express');
const path = require('path');
const app = express();

// Serve static files from frontend directory
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

// Specific static routes for better organization
app.use('/css', express.static(path.join(__dirname, 'frontend/css')));
app.use('/webpages', express.static(path.join(__dirname, 'frontend/webpages')));


app.get('/', (req, res) => {
  res.redirect('/frontend/webpages');
});

app.get('/frontend/webpages', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'webpages', 'homepage.html'));
});

app.listen(8080, () => {
  console.log('Server running on port 8080');
});