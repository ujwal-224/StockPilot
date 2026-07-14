# StockPilot — Kirana Ledger Dashboard

> A modern, responsive inventory & analytics dashboard built for Indian kirana store owners. Inspired by the traditional **Bahi-Khata** ledger aesthetic — warm paper tones, maroon spine accents, and IBM Plex typography.

![StockPilot](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss)

---

## ✨ Features

| Page | What's inside |
|---|---|
| 🏠 **Home** | Stat cards (Total Items, Low Stock, Today's Updates), Needs Attention list with progress bars, Recent Activity feed |
| 📦 **Inventory** | Live search, filter pills (All / Low Stock / Out of Stock), color-coded stock cards with spine accents |
| 📊 **Analytics** | Weekly sales summary, interactive bar chart with hover tooltips, Fast Moving Items, Category breakdown, animated Report generator |
| 👤 **Profile** | Store info card, settings menu, notification toggles, logout |

### Responsive breakpoints

- **Mobile** — Bottom navigation bar + floating action button
- **Tablet (`md`)** — Wider layout, search bar in header
- **Desktop (`lg`)** — Fixed left sidebar with nav links, two-column content grid

---

## 🛠 Tech Stack

- **React 19** + **TypeScript 6**
- **Vite 8** (dev server + bundler)
- **Tailwind CSS 3** (custom design tokens — Bahi-Khata color palette)
- **IBM Plex Sans / Mono** + **Zilla Slab** (Google Fonts)
- **Material Symbols Outlined** (Google Icons)
- State-based routing (no router library needed)

---

## 📁 Project Structure

```
StockPilot/
└── frontend/
    ├── index.html                  # Entry HTML — loads Google Fonts & Material Symbols
    ├── tailwind.config.js          # Full design token system (colors, fonts, spacing)
    ├── vite.config.ts
    └── src/
        ├── main.tsx                # React root
        ├── App.tsx                 # State-based page router
        ├── index.css               # Tailwind directives + custom utilities
        ├── types.ts                # Shared TypeScript types (PageId)
        ├── components/
        │   └── Layout.tsx          # Sidebar (desktop) + Header + Bottom Nav + FAB
        └── pages/
            ├── Home.tsx            # Dashboard overview
            ├── Inventory.tsx       # Live inventory with search & filters
            ├── Analytics.tsx       # Sales charts and reports
            └── Profile.tsx         # Store profile and settings
```

---

## 🚀 Getting Started (Local Setup)

### Prerequisites

Make sure you have the following installed on your machine:

| Tool | Version | Download |
|---|---|---|
| **Node.js** | v18 or higher | [nodejs.org](https://nodejs.org) |
| **npm** | v9 or higher | Comes with Node.js |
| **Git** | any | [git-scm.com](https://git-scm.com) |

Verify your versions:
```bash
node -v    # should print v18.x.x or higher
npm -v     # should print 9.x.x or higher
git --version
```

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/ujwal-224/StockPilot.git
```

### Step 2 — Navigate into the frontend folder

```bash
cd StockPilot/frontend
```

### Step 3 — Install dependencies

```bash
npm install
```

> This installs React, Vite, TypeScript, Tailwind CSS, and all dev dependencies listed in `package.json`.

### Step 4 — Start the development server

```bash
npm run dev
```

You should see output like:

```
  VITE v8.x.x  ready in 300ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 5 — Open in your browser

Visit **[http://localhost:5173](http://localhost:5173)** 🎉

---

## 🧱 Available Scripts

Run these from inside the `frontend/` directory:

```bash
# Start local dev server with hot-reload
npm run dev

# Type-check TypeScript without building
npx tsc --noEmit

# Build optimized production bundle
npm run build

# Preview the production build locally
npm run preview

# Run ESLint
npm run lint
```

---

## 🎨 Design System

The app uses a custom Tailwind design token system defined in `tailwind.config.js`.

### Key color tokens

| Token | Hex | Usage |
|---|---|---|
| `brand-maroon` / `primary` | `#51141a` | Primary actions, headings, active nav |
| `brand-turmeric` | `#BD8A1E` | Low stock warnings |
| `ledger-surface` | `#F4F2EC` | Card backgrounds |
| `ledger-paper` | `#E7E4DC` | Page background (warm parchment) |
| `stock-green` | `#2D5A27` | In-stock indicators |
| `stock-red` | `#B33B2E` | Out-of-stock indicators |
| `ink-blue` | `#3B5166` | Chart bars (Analytics) |

### Typography

| Class | Font | Usage |
|---|---|---|
| `font-headline-*` | Zilla Slab | Section titles, page headings |
| `font-body-*` | IBM Plex Sans | Body text, labels |
| `font-number-*` | IBM Plex Mono | Prices, quantities, data values |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">Built with ❤️ for kirana store owners across India</p>
