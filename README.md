# StockPilot – AI-Powered Inventory Management Through WhatsApp

> **Manage inventory as naturally as sending a WhatsApp message.**

StockPilot is an AI-powered inventory management assistant built specifically for Indian kirana stores and small retailers. Instead of requiring shopkeepers to learn complicated inventory software, StockPilot allows them to simply send natural language messages through WhatsApp, such as:

> **"Sold 5 Maggi packets"**
> **"Add 20 Coca-Cola bottles"**

The AI understands the intent, updates inventory instantly, stores the transaction, and synchronizes everything with a modern analytics dashboard.

Built during a hackathon, StockPilot combines the familiarity of WhatsApp with the intelligence of Large Language Models to create an affordable, intuitive inventory management system for India's small businesses.

---

# ✨ Why StockPilot?

Small shopkeepers still rely on:

* Handwritten notebooks
* Memory
* Paper bills

This often results in:

* Lost sales due to incorrect stock information
* Overstocking and dead inventory
* Manual calculations
* Poor visibility into business performance

Existing inventory software exists—but most kirana owners avoid it because it requires:

* Installing new applications
* Learning complex interfaces
* Paying monthly subscription fees
* Training employees

StockPilot removes all these barriers.

If a shopkeeper already knows how to send a WhatsApp message, they already know how to use StockPilot.

---

# 🚀 Features

## 📱 WhatsApp-Based Inventory Management

Manage inventory directly through WhatsApp.

Examples:

* Sold 5 Maggi packets
* Add 20 rice bags
* Purchased 10 soap boxes
* Reduce sugar by 5

No forms.

No complicated software.

No learning curve.

---

## 🧠 AI-Powered Natural Language Understanding

Instead of relying on rigid commands, StockPilot uses Large Language Models to understand natural conversations.

All of these are interpreted correctly:

* Sold 5 rice bags
* I sold five rice bags
* Reduce rice by five
* Five rice bags are sold

The AI extracts:

* Intent
* Product
* Quantity
* Action

and updates inventory automatically.

---

## 🧠 Persistent Conversation Memory (Mem0)

Traditional AI forgets previous conversations.

Example:

User:

> Add Pepsi

AI:

> Done.

User:

> How many are left?

Without memory, the AI doesn't know what "they" refers to.

Mem0 stores conversation history so the assistant remembers previous products and conversations naturally.

---

## ⚡ Fast AI Processing with Groq

StockPilot uses Groq for:

* Low latency inference
* Fast response generation
* Affordable AI processing
* Real-time inventory updates

---

## 📦 Inventory Management

* Add Products
* Update Stock
* Delete Products
* Low Stock Alerts
* Search Inventory
* Inventory Status Filters

---

## 📒 Digital Transactions Ledger

Automatically records:

* Sales
* Purchases
* Inventory Adjustments

Maintains a complete digital ledger inspired by the traditional Bahi-Khata bookkeeping system.

---

## 📊 Analytics Dashboard

A synchronized dashboard provides:

* Total Products
* Low Stock Items
* Daily Activity
* Revenue Insights
* Inventory Analytics
* Fast-Moving Products
* Weekly Reports

---

# 🏗 Overall Architecture

```
Shopkeeper
      │
      ▼
 WhatsApp
      │
      ▼
Meta WhatsApp Cloud API
      │
      ▼
Webhook
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

---

# 🔄 Workflow

### Example

Shopkeeper sends:

```
Sold 5 Maggi packets
```

Flow:

```
Shopkeeper

↓

WhatsApp

↓

Meta WhatsApp Cloud API

↓

Webhook

↓

Express Backend

↓

Groq AI

↓

Intent Extraction

↓

MongoDB Update

↓

Dashboard Sync

↓

AI Confirmation

↓

WhatsApp Reply
```

Reply:

```
Successfully recorded.

5 Maggi packets sold.

Remaining Stock: 37
```

---

# 🛠 Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

## Backend

* Node.js
* Express.js

## Database

* MongoDB Atlas
* Mongoose

## AI

* Groq
* Mem0

## Communication

* Meta WhatsApp Cloud API
* Webhooks

## Authentication

* JWT

## Deployment

* Vercel
* Render

---

# 📁 Project Structure

```
StockPilot/
│
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
    │   ├── types/
    │   ├── App.tsx
    │   └── index.css
    ├── tailwind.config.js
    └── package.json
```

---

# 🚀 Local Setup

## Backend

```bash
cd backend
npm install
```

Create `.env`

```env
PORT=5000

MONGO_URI=your_mongodb_connection

GROQ_API_KEY=your_groq_api_key

GROQ_MODEL=your_groq_model

JWT_SECRET=your_secret

JWT_EXPIRES_IN=7d

CORS_ORIGINS=http://localhost:5173

WHATSAPP_ACCESS_TOKEN=your_access_token

WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

WHATSAPP_BUSINESS_NUMBER=919999999999

WHATSAPP_VERIFY_TOKEN=your_verify_token

WHATSAPP_LOW_STOCK_TEMPLATE=stockpilot_low_stock

WHATSAPP_TEMPLATE_LANGUAGE=en_US

WHATSAPP_GRAPH_VERSION=v23.0

META_APP_SECRET=your_meta_app_secret
```

Run backend

```bash
npm run dev
```

---

## Frontend

```bash
cd frontend

npm install
```

Create `.env`

```env
VITE_API_URL=http://localhost:5000
```

Run

```bash
npm run dev
```

Open

```
http://localhost:5173
```

---

# ☁ Deployment

## Backend

Deploy on **Render**

Environment Variables:

* MONGO_URI
* GROQ_API_KEY
* GROQ_MODEL
* JWT_SECRET
* CORS_ORIGINS
* WhatsApp Cloud API credentials

---

## Frontend

Deploy on **Vercel**

Environment Variable

```
VITE_API_URL=https://your-render-api-url
```

---

# 💡 Future Scope

* Voice Notes
* Regional Language Support
* OCR Bill Scanner
* Barcode Scanner
* GST Report Generation
* AI Sales Prediction
* Demand Forecasting
* Supplier Integration
* Smart Purchase Recommendations

---

# 🎯 Challenges Solved

* WhatsApp Cloud API Integration
* Webhook Verification
* Natural Language Processing
* AI Conversation Memory
* Real-Time Inventory Synchronization
* MongoDB Integration
* Dashboard Synchronization

---

# 🌍 Real-World Impact

StockPilot is designed for:

* Kirana Stores
* Grocery Shops
* Medical Stores
* Stationery Shops
* Bakeries
* Hardware Stores
* Small Retail Businesses

---

# ❤️ Why StockPilot?

| Traditional Inventory Software | StockPilot             |
| ------------------------------ | ---------------------- |
| Requires separate software     | Works through WhatsApp |
| Complex interface              | Natural conversation   |
| Employee training              | No training required   |
| Expensive subscriptions        | Affordable & scalable  |
| Manual inventory updates       | AI-powered automation  |

---

# 👨‍💻 Built During Hackathon

StockPilot demonstrates how conversational AI, persistent memory, and messaging platforms can transform inventory management for millions of small businesses across India by making technology accessible through tools they already use every day.
