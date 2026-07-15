# StockPilot Backend - Phase 1

A modular Node.js + Express boilerplate built for the StockPilot hackathon project.

## Tech Stack
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **dotenv** - Environment variable management
- **cors** - Cross-Origin Resource Sharing middleware
- **nodemon** - Hot-reloading development server

## Getting Started

### Installation

Navigate to the `backend` folder and install the dependencies:

```bash
npm install
```

### Running the Application

To run the application in development mode with automatic restarts on file changes:

```bash
npm run dev
```

The server will start on [http://localhost:5000](http://localhost:5000).

To start the server in production mode:

```bash
npm start
```

### Health Check

To verify the server is running properly, make a `GET` request to:
`http://localhost:5000/`

**Expected response (Status 200):**
```json
{
  "success": true,
  "message": "StockPilot Backend Running"
}
```
