const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to serve static files
app.use(express.static('.'));

// Special route for map.html that injects the API key
app.get('/map.html', (req, res) => {
  try {
    let htmlContent = fs.readFileSync('map.html', 'utf8');
    
    // Replace the API_KEY placeholder with the actual key from environment
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).send('API key not found in environment variables');
    }
    
    htmlContent = htmlContent.replace(
      /const GOOGLE_MAPS_API_KEY = API_KEY;/,
      `const GOOGLE_MAPS_API_KEY = '${apiKey}';`
    );
    
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error serving map.html:', error);
    res.status(500).send('Error loading map.html');
  }
});

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`�� Serving files from: ${__dirname}`);
  console.log(`🗺️  Map page available at: http://localhost:${port}/map.html`);
  
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️  Warning: GOOGLE_MAPS_API_KEY not found in environment variables');
  } else {
    console.log('✅ API key loaded successfully');
  }
});