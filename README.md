# Physarum Map Router

A web app to simulates slime mold (physarum) growth on Google Maps, inspired by an old study that uses slime mold to find paths for transportation for Tokyo's metro system. Here, the physarum algorithm creates efficient transport networks on actual geographic locations!


## Prerequisites

Before running this project, you'll need:

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- **Google Maps API Key** (free tier available)

## Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd aterliers25
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google Maps API Key**
   
   You'll need a Google Maps API key with the following APIs enabled:
   - Maps JavaScript API
   - Places API
   
   **To get an API key:**
   1. Go to [Google Cloud Console](https://console.cloud.google.com/)
   2. Create a new project or select an existing one
   3. Enable the Maps JavaScript API and Places API
   4. Go to "Credentials" and create an API key
   5. Restrict the key to your domain for security
   
    Then create an .env file and set the key there: API_KEY=...


The application will start on `http://localhost:3000` using npm start


