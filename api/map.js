const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    // Read the map.html file
    const mapHtmlPath = path.join(process.cwd(), 'map.html');
    let htmlContent = fs.readFileSync(mapHtmlPath, 'utf8');
    
    // Get the API key from environment variables
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).send('API key not found in environment variables');
    }
    
    // Replace the API_KEY placeholder with the actual key
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
};

