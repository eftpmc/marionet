# Marionet <img src="./logo.png" alt="Marionet Logo" width="40"/>

Marionet is a **self-hosted, Dockerized web scraping application** designed to run your scraping tasks reliably and securely.  
It includes support for authentication via cookies, task scheduling, and headless browser automation.

---

## Features
- Self-hosted, runs in Docker.
- Web-based dashboard for managing scraping.
- Codeless action flow for creating webscrapers.

---

## Default Login

When you first run Armer, you can log in with:

- **Username:** `test`
- **Password:** `1234`

---

## Setup Instructions

1. **Clone this repository**:
   ```bash
   git clone https://github.com/yourusername/armer.git
   cd armer
   ```

2. **Build and start with Docker Compose**:
   ```bash
   docker compose up -d --build
   ```

3. **Access the web interface**:  
   Open your browser and go to:
   ```
   http://localhost:3000
   ```

---

## Using `save-cookies.js`

If you need to log into a site that requires cookies:

1. Install dependencies:
   ```bash
   npm install puppeteer
   ```

2. Run the script to save your cookies (with URL parameter):
   ```bash
   node save-cookies.js https://example.com/login
   ```

3. Follow the prompts in the browser window and log into the site manually.

4. Once finished, cookies will be saved to a JSON file (e.g., `cookies.json`).  
   Place this file in the appropriate config directory for Armer.

---

## Configuration

- Environment variables can be set in `.env`.

### Example `.env`
```env
SESSION_SECRET=superlongandrandomstring1234567890
```

- Cookie files go in `config/cookies/`.

---

## License
MIT
