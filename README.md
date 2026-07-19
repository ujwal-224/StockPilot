# StockPilot -- AI-Powered Inventory Management Assistant

> **Manage inventory naturally using AI-powered conversations.**

StockPilot is an AI-powered inventory management assistant built
specifically for Indian kirana stores and small retailers.

Instead of requiring shopkeepers to learn complicated inventory
software, StockPilot enables natural language-based inventory
management, allowing users to interact with the system using simple
conversational commands.

The AI understands user intent, updates inventory, stores transactions,
and synchronizes everything with a modern analytics dashboard.

Built during a hackathon, StockPilot combines conversational AI,
intelligent inventory management, and business analytics to create an
affordable and intuitive solution for India's small retailers.

------------------------------------------------------------------------

#  Why StockPilot?

Small shopkeepers still rely on:

-   Handwritten notebooks
-   Memory
-   Paper bills

This often results in:

-   Lost sales due to incorrect stock information
-   Overstocking and dead inventory
-   Manual calculations
-   Poor visibility into business performance

Existing inventory software often requires:

-   Installing new applications
-   Learning complex interfaces
-   Monthly subscription fees
-   Staff training

StockPilot is designed to feel as natural as having a conversation,
removing the complexity of traditional inventory software.

------------------------------------------------------------------------

#  Features

##  Natural Language Inventory Management

Manage inventory using simple conversational commands.

Examples:

-   Sold 5 Maggi packets
-   Add 20 rice bags
-   Purchased 10 soap boxes
-   Reduce sugar by 5

Simple, conversational interactions designed for ease of use.

------------------------------------------------------------------------

##  AI-Powered Natural Language Understanding

The AI understands multiple ways of expressing the same action.

Examples:

-   Sold 5 rice bags
-   I sold five rice bags
-   Reduce rice by five
-   Five rice bags are sold

The AI extracts:

-   Intent
-   Product
-   Quantity
-   Action

and updates inventory automatically.

------------------------------------------------------------------------

##  Persistent Conversation Memory (Mem0)

Mem0 allows the assistant to remember previous interactions, enabling
natural follow-up conversations and better context understanding.

------------------------------------------------------------------------

##  Fast AI Processing with Groq

StockPilot uses Groq for:

-   Fast inference
-   Low latency
-   Affordable AI processing
-   Real-time inventory intelligence

------------------------------------------------------------------------

##  Inventory Management

-   Add products
-   Edit products
-   Delete products
-   Search inventory
-   Low stock monitoring
-   Inventory status filters

------------------------------------------------------------------------

##  Digital Transactions Ledger

Automatically records:

-   Sales
-   Purchases
-   Stock adjustments

Inspired by the traditional Bahi-Khata bookkeeping system.

------------------------------------------------------------------------

##  Analytics Dashboard

Provides:

-   Total products
-   Low stock alerts
-   Revenue overview
-   Category analytics
-   Fast-moving products
-   Weekly reports

------------------------------------------------------------------------

#  Architecture

``` text
Store Owner
      │
      ▼
StockPilot Interface
      │
      ▼
Express Backend
      │
      ▼
Groq AI + Mem0
      │
      ▼
MongoDB Atlas
      │
      ▼
React Dashboard
```

------------------------------------------------------------------------

#  Workflow

User Input

``` text
Sold 5 Maggi packets
```

Flow

``` text
User
   │
   ▼
StockPilot
   │
   ▼
Express Backend
   │
   ▼
Groq AI
   │
   ▼
Intent Extraction
   │
   ▼
MongoDB Update
   │
   ▼
Dashboard Sync
   │
   ▼
AI Confirmation
```

Example Reply

``` text
Successfully recorded.

5 Maggi packets sold.

Remaining Stock: 37
```

------------------------------------------------------------------------

#  Technology Stack

## Frontend

-   React
-   TypeScript
-   Vite
-   Tailwind CSS

## Backend

-   Node.js
-   Express.js

## Database

-   MongoDB Atlas
-   Mongoose

## AI

-   Groq
-   Mem0

## Authentication

-   JWT

## Deployment

-   Vercel
-   Render

------------------------------------------------------------------------

# 📁 Project Structure

``` text
StockPilot/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── types.ts
    │   ├── App.tsx
    │   └── index.css
    ├── tailwind.config.js
    └── package.json
```

------------------------------------------------------------------------

#  Local Setup

## Backend

``` bash
cd backend
npm install
```

Create `.env`

``` env
PORT=5000
MONGO_URI=your_mongodb_connection
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=your_groq_model
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173
```

Run

``` bash
npm run dev
```

------------------------------------------------------------------------

## Frontend

``` bash
cd frontend
npm install
```

Create `.env`

``` env
VITE_API_URL=http://localhost:5000
```

Run

``` bash
npm run dev
```

Open http://localhost:5173

------------------------------------------------------------------------

#  Deployment

## Backend

Deploy on **Render**

Environment Variables

-   MONGO_URI
-   GROQ_API_KEY
-   GROQ_MODEL
-   JWT_SECRET
-   CORS_ORIGINS

## Frontend

Deploy on **Vercel**

Environment Variable

``` env
VITE_API_URL=https://your-render-api-url
```

------------------------------------------------------------------------

#  Future Scope

-   WhatsApp Integration
-   Voice Notes
-   Regional Language Support
-   OCR Bill Scanner
-   Barcode Scanner
-   GST Reports
-   Sales Prediction
-   Demand Forecasting
-   Supplier Integration
-   Smart Purchase Recommendations

------------------------------------------------------------------------

#  Challenges Solved

-   AI-powered natural language processing
-   Inventory synchronization
-   MongoDB integration
-   Dashboard synchronization
-   AI conversation flow
-   Integretion of Mem0 and Gnani.ai
------------------------------------------------------------------------

#  Real-World Impact

Designed for:

-   Kirana Stores
-   Grocery Stores
-   Medical Stores
-   Bakeries
-   Stationery Shops
-   Small Retail Businesses

------------------------------------------------------------------------

#  Why StockPilot?

  Traditional Inventory Software   StockPilot
  -------------------------------- -------------------------------
  Complex interface                Natural language interactions
  Employee training                Easy to learn
  Manual inventory updates         AI-powered automation
  Limited analytics                Smart business insights
  Expensive subscriptions          Affordable & scalable

------------------------------------------------------------------------

#  Built During Hackathon

StockPilot demonstrates how conversational AI, persistent memory, and
intelligent analytics can transform inventory management for millions of
small businesses across India by making inventory management simple,
intuitive, and accessible.
