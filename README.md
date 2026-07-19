# StockPilot

Inventory, ledger, analytics, team management, AI assistance, and WhatsApp stock operations for kirana stores.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel)](https://stock-pilot-eosin.vercel.app/)
[![Render](https://img.shields.io/badge/API-Render-46E3B7?logo=render&logoColor=black)](https://stockpilot-g28i.onrender.com/)

**Live application:** [stock-pilot-eosin.vercel.app](https://stock-pilot-eosin.vercel.app/)

**API health check:** [stockpilot-g28i.onrender.com](https://stockpilot-g28i.onrender.com/)

## Overview

StockPilot replaces a paper inventory ledger with a responsive, role-aware web application. Store owners and their teams can manage products, record purchases and sales, monitor stock health, review analytics, and query inventory from WhatsApp.

The interface uses a warm bahi-khata-inspired visual system while the application is split into an independently deployable React frontend and Express API.

## Features

- **Dashboard:** inventory totals, low-stock indicators, recent activity, and operational summaries.
- **Inventory:** create, search, filter, edit, and delete products with stock thresholds and units.
- **Transaction ledger:** record purchases, sales, and stock adjustments with an auditable history.
- **Analytics:** revenue and inventory trends, category summaries, and fast-moving items.
- **Authentication and roles:** shop-scoped access for owners, managers, and workers.
- **Team management:** invitations, membership controls, and audit logs.
- **AI assistant:** Groq-powered inventory chat, insights, and optional voice input.
- **Memory:** optional Mem0-backed assistant memory with user controls.
- **WhatsApp:** manual click-to-chat plus automated Twilio Sandbox stock commands.
- **Responsive UI:** desktop and mobile layouts built with React and Tailwind CSS.

## WhatsApp stock commands

After linking a WhatsApp number to a StockPilot membership, send these commands to the configured WhatsApp sender:

| Command | Result |
| --- | --- |
| `HELP` | Lists available commands. |
| `STOCK rice` | Returns quantity, unit, threshold, and stock status for a product. |
| `LOW` | Lists products at or below their configured threshold. |
| `OUT` | Lists out-of-stock products. |
| `ADD rice 20` | Prepares a purchase that adds 20 units. |
| `SALE rice 3` | Prepares a sale of 3 units. |
| `SET rice 15` | Prepares a stock-count adjustment. |
| `YES` / `NO` | Confirms or cancels a pending stock change. |

Mutating commands require explicit confirmation and expire after five minutes. A shop linking code expires after ten minutes.

## Architecture

```text
Browser / Mobile
       │
       ▼
React + TypeScript frontend (Vercel)
       │  HTTPS / JSON
       ▼
Node.js + Express API (Render)
       │
       ├── MongoDB Atlas
       ├── Groq / Gnani / Mem0 (optional)
       └── Twilio or Meta WhatsApp webhooks
```

```text
StockPilot/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # HTTP and webhook handlers
│   │   ├── middleware/      # Authentication, authorization, rate limits
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routes
│   │   └── services/        # Inventory, AI, memory, and WhatsApp logic
│   ├── test/                # Node test suite
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── services/
    ├── vercel.json
    └── package.json
```

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript 6, Vite 8, Tailwind CSS 3, Axios |
| Backend | Node.js 22+, Express 4, ES modules |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, bcrypt |
| AI and voice | Groq, Gnani STT, optional Mem0 |
| WhatsApp | Twilio WhatsApp Sandbox and Meta Cloud API support |
| Hosting | Vercel frontend, Render backend |

## Local development

### Prerequisites

- Node.js `22.12.0` or newer
- npm
- MongoDB database

### 1. Clone and install

```bash
git clone https://github.com/ujwal-224/StockPilot.git
cd StockPilot

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

At minimum, set:

```env
PORT=5000
MONGO_URI=mongodb+srv://USER:PASSWORD@HOST/StockPilot
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173
APP_TIMEZONE=Asia/Kolkata
```

Optional integrations:

```env
GROQ_API_KEY=
GROQ_MODEL=
MEM0_API_KEY=
GNANI_API_KEY=
```

Never commit `.env` files or expose credentials in screenshots, logs, or pull requests.

### 3. Configure the frontend

Create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:5000
```

Only variables beginning with `VITE_` are exposed to browser code. Never place private credentials in the frontend environment.

### 4. Run the application

Backend terminal:

```bash
cd backend
npm run dev
```

Frontend terminal:

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API health check is available at [http://localhost:5000](http://localhost:5000).

## Twilio WhatsApp Sandbox setup

Use the Sandbox for development and demonstrations. A production deployment should register an approved WhatsApp sender.

1. In Twilio Console, open **Messaging → Try it out → Send a WhatsApp message**.
2. Join the Sandbox from each test phone by sending the displayed `join <sandbox-name>` message to the Sandbox number.
3. Add these variables to the backend environment:

   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_private_auth_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

4. Under **Sandbox settings**, set **When a message comes in** to:

   ```text
   https://YOUR_BACKEND/api/whatsapp/twilio-webhook
   ```

   Use `POST` and leave the status callback empty unless delivery tracking is configured.

5. Sign in to StockPilot and open **Profile → WhatsApp Integration**.
6. Generate a shop linking code and send the prepared `LINK SP-xxxxxx` message from the joined phone.
7. Send `HELP`, then test a read-only command such as `STOCK rice`.

Twilio requests are verified using the `X-Twilio-Signature` header. If a reverse proxy changes the public URL used during signature validation, set:

```env
TWILIO_WEBHOOK_URL=https://YOUR_BACKEND/api/whatsapp/twilio-webhook
```

## Meta WhatsApp Cloud API

The backend also supports Meta Cloud API webhooks and approved low-stock templates. Configure the following only when using Meta directly:

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_NUMBER=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_LOW_STOCK_TEMPLATE=stockpilot_low_stock
WHATSAPP_TEMPLATE_LANGUAGE=en_US
WHATSAPP_GRAPH_VERSION=v23.0
META_APP_SECRET=
```

Configure Meta's callback as `https://YOUR_BACKEND/api/whatsapp/webhook` and subscribe it to the `messages` field. Webhook verification uses `WHATSAPP_VERIFY_TOKEN`; payload signatures use `META_APP_SECRET`.

## Deployment

### Backend on Render

| Setting | Value |
| --- | --- |
| Root directory | `backend` |
| Runtime | Node |
| Build command | `npm install` |
| Start command | `npm start` |

Copy the required backend variables from `.env.example` into Render's environment settings. Set `CORS_ORIGINS` to the deployed frontend origin. After changing environment variables, redeploy the latest commit.

### Frontend on Vercel

| Setting | Value |
| --- | --- |
| Root directory | `frontend` |
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

Set the production API endpoint in Vercel:

```env
VITE_API_URL=https://YOUR_BACKEND
```

Redeploy after changing `VITE_API_URL`; Vite injects it during the build.

## Scripts

### Backend

```bash
npm run dev     # Start with file watching
npm start       # Start the production server
npm test        # Run the Node test suite
```

### Frontend

```bash
npm run dev     # Start the Vite development server
npm run build   # Type-check and create a production build
npm run lint    # Run ESLint
npm run preview # Preview the production build locally
```

## API overview

All protected application routes require a valid JWT. Resources are scoped to the authenticated shop and authorization checks are enforced for privileged operations.

| Prefix | Purpose |
| --- | --- |
| `/api/auth` | Sign-up, sign-in, and current-user session |
| `/api/products` | Product CRUD and low-stock queries |
| `/api/transactions` | Purchases, sales, adjustments, and ledger history |
| `/api/dashboard` | Dashboard summaries |
| `/api/analytics` | Shop analytics |
| `/api/shop` | Shop profile |
| `/api/team` | Members, invitations, and audit logs |
| `/api/ai` | Chat, insights, and speech-to-text |
| `/api/memory` | Assistant memory controls |
| `/api/whatsapp` | Account linking and provider webhooks |

## Security notes

- Secrets stay in backend environment variables; they are never shipped to the browser.
- Passwords are hashed and sessions use signed JWTs.
- Product and transaction operations are scoped to the authenticated shop.
- Role checks restrict sensitive owner and manager actions.
- WhatsApp webhook signatures are validated before commands are processed.
- Inventory-changing WhatsApp commands require a second confirmation message.
- Webhook and authentication routes are rate-limited.

## Validation

Before opening a pull request:

```bash
cd backend && npm test
cd ../frontend && npm run lint && npm run build
```

---

Built for practical, mobile-friendly inventory management in neighborhood retail.
