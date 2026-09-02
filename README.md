# LACVAY — Batangas City Travel Assistant

A modern responsive web application for Batangas City transportation, tourism, and travel assistance.

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Leaflet, Lucide icons
- **Backend:** Node.js, Express
- **Maps:** Leaflet + OpenStreetMap (Google Maps ready via env)
- **AI:** Gemini API (optional) with mock fallback

## Project Structure

```
lacvay/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # UI & layout components
│       ├── context/        # App state (saved, history, AI)
│       ├── data/           # Mock data
│       ├── lib/            # Utilities & fare logic
│       ├── pages/          # Route pages
│       ├── services/       # API & data services
│       └── types/          # TypeScript interfaces
├── server/                 # Express API
│   └── src/
│       ├── routes/         # API routes
│       └── services/       # AI service layer
└── package.json            # Monorepo root
```

## Getting Started

### No admin password? Use portable Node (recommended for this project)

You **do not** need to install Node.js on Windows. This repo can use a **portable copy** inside `.tools/node` — it only writes to this folder and needs **no admin rights**.

**Easiest way — double-click:**

```
lacvay-dev.bat
```

That script will (first time only) download Node, install dependencies, and start the app.

**Or use PowerShell:**

```powershell
.\setup-node.ps1    # download portable Node (once)
.\install.ps1       # npm install (once, or after package changes)
.\dev.ps1           # start frontend + API
```

Open **http://localhost:5173** in your browser.

If download is blocked by firewall, ask IT to allow `nodejs.org`, or download manually:
1. Get [Node.js Windows x64 ZIP](https://nodejs.org/dist/v22.14.0/node-v22.14.0-win-x64.zip)
2. Extract so you have `lacvay\.tools\node\node.exe`
3. Run `lacvay-dev.bat` again

### Standard install (if you have Node.js globally)

- Node.js 18+

```bash
npm install
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

### Environment Variables

Copy `.env.example` to `.env` and optionally set:

- `GEMINI_API_KEY` — Enables real AI responses
- `GOOGLE_MAPS_API_KEY` — For future Google Maps integration
- `VITE_API_URL` — API base URL (defaults to proxy `/api`)

## Routes

| Path | Page |
|------|------|
| `/` | Home dashboard |
| `/map` | Map & Routes |
| `/commute` | Commute Guide |
| `/fares` | Fare Checker |
| `/rides` | Book a Ride |
| `/tourist-spots` | Tourist Spots |
| `/ai-assistant` | AI Travel Assistant |
| `/restaurants` | Nearby Restaurants |
| `/promotions` | Promotions |
| `/saved` | Saved places |
| `/history` | Search history |
| `/settings` | Settings |

## License

Private — LACVAY prototype
