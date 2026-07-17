# StockPilot — Kirana Ledger & Analytics Dashboard

> A modern, responsive inventory management & predictive analytics dashboard built for Indian kirana store owners. StockPilot blends the warm, traditional aesthetic of the **Bahi-Khata** paper ledger (featuring warm parchment tones, maroon spine accents, and monospace numerical alignment) with cutting-edge technology like Node.js, MongoDB, and Gemini AI.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com)

---

## ✨ Features & Architecture

StockPilot is structured as a decoupled monorepo containing a **React Frontend Client** and a **Node.js Express Backend API**.

| Section | What's Inside | Responsive Features |
|---|---|---|
| 🏠 **Home Dashboard** | High-level KPI cards (Total Items, Low Stock, Today's Updates), items needing immediate restocking, and recent ledger activities. | Summary grid stacks on mobile; touch-friendly cards for high visual priority. |
| 📦 **Live Inventory** | Search bar and status pill filters (`All`, `Low Stock`, `Out of Stock`). In-app modals to **Add**, **Edit**, or **Delete** products. | Cards automatically scale down and progress bars adapt dynamically to 320px+ viewports. Modals feature premium blurred, dimmed overlays. |
| 💸 **Transactions Ledger** | Logging system to record sales, stock adjustments, and wholesale purchases. | Displays as a detailed data table on desktop, and transforms into clean vertical ledger slip-cards on mobile devices. |
| 📊 **Gemini Analytics** | Weekly revenue chart, category breakdown, fast-moving items, and custom PDF weekly reports. | Dynamic SVG bar chart with hover tooltips adapts seamlessly to container widths. |
| 👤 **Store Profile** | Digital merchant settings, business hours configuration, and active WhatsApp integrations. | Stacks elements into a beautiful, linear layout on smaller screens. |

---

## 🛠 Tech Stack

### Frontend Client
* **React 19** & **TypeScript 6**
* **Vite 8** (Ultra-fast HMR Dev Server + Rollup Bundler)
* **Tailwind CSS 3** (Custom design tokens configuring the traditional Bahi-Khata palette)
* **React Hot Toast** (Premium notification toasts)
* State-based local routing (eliminating heavy external dependencies)

### Backend API
* **Node.js (ES Modules)** & **Express 4**
* **MongoDB Atlas & Mongoose** (NoSQL schema-based database)
* **Gemini API** integration (for predictive stock analytics and smart reporting)
* **Cors** & **Dotenv** configuration

---

## 📁 Project Structure

```
StockPilot/
├── backend/                       # Express Node.js Server
│   ├── src/
│   │   ├── config/database.js     # MongoDB connection setup
│   │   ├── controllers/           # API request controllers (Product, Analytics)
│   │   ├── middleware/            # Error handling & CORS middlewares
│   │   ├── models/                # Mongoose Database Schemas
│   │   ├── routes/                # API Endpoints (Products, Transactions)
│   │   └── server.js              # Application entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/                      # React Vite Client
    ├── public/                    # Assets & Brand Logos
    ├── src/
    │   ├── components/
    │   │   ├── Layout.tsx         # Responsive Sidebar, Header, & Bottom Nav Shell
    │   │   └── SharedComponents.tsx # Cards, badges, loading, search bar
    │   ├── pages/                 # Home, Inventory, Transactions, Analytics, Profile
    │   ├── services/              # API Client fetch calls (Axios)
    │   ├── types.ts               # Shared TypeScript schemas
    │   ├── index.css              # Custom parchment typography & accent lines
    │   └── App.tsx                # Page switching state router
    ├── tailwind.config.js         # Material Design 3 theme extensions
    └── package.json
```

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
Ensure you have **Node.js v22.12+** and **npm v10+** installed.

---

### Step 1: Set Up the Backend API

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder based on `.env.example`:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/StockPilot
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=your_groq_model
   JWT_SECRET=replace_with_a_long_random_secret
   JWT_EXPIRES_IN=7d
   CORS_ORIGINS=http://localhost:5173
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The API will boot on **[http://localhost:5000](http://localhost:5000)**.
   * *Verify by visiting [http://localhost:5000/](http://localhost:5000/) in your browser. You should receive a `"StockPilot Backend Running"` JSON response.*

---

### Step 2: Set Up the Frontend Client

1. Open a new terminal tab and navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` folder:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
4. Start the frontend client:
   ```bash
   npm run dev
   ```
5. Open **[http://localhost:5173](http://localhost:5173)** in your browser 🎉

---

## ☁️ Deployment Instructions

### 1. Deploy the Backend (on [Render.com](https://render.com))
1. Log in to Render and create a new **Web Service**.
2. Link your GitHub Repository.
3. Configure these subdirectory details:
   * **Root Directory**: `backend` (very important)
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
4. Add the following **Environment Variables** in the settings tab:
   * `MONGO_URI` (your MongoDB connection string)
   * `GROQ_API_KEY` and `GROQ_MODEL` (your Groq credentials)
   * `JWT_SECRET` (a long random production secret)
   * `CORS_ORIGINS` (your deployed frontend URL)
   * `PORT` = `5000` (Render allocates this dynamically, but setting it matches internal configs)
5. Deploy. You will receive a public API URL (e.g. `https://stockpilot-api.onrender.com`).

### 2. Deploy the Frontend (on [Vercel.com](https://vercel.com))
1. Log in to Vercel and **Add New Project**.
2. Link your GitHub Repository.
3. Configure these directory settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend` (very important)
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   * **Key**: `VITE_API_URL`
   * **Value**: `https://stockpilot-api.onrender.com` (your live Render API URL, without a trailing slash)
5. Click **Deploy**. Vercel will host your static React build and hook it directly to your live backend.

---

## 🧱 Production Build Scripts

### Backend
* `npm start`: Starts the production server.
* `npm run dev`: Starts Node server with nodemon file watching.

### Frontend
* `npm run build`: Type-checks TypeScript files and compiles the minified production assets into `dist/`.
* `npm run preview`: Hosts the built `dist/` folder locally to test production builds before deploying.
* `npm run lint`: Performs static analysis lint checks.

---

<p align="center">Built with ❤️ for kirana store owners across India during the Hackathon</p>
