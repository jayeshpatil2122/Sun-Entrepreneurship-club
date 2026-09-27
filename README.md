# SEBC — Sandip Entrepreneurship & Business Club (ThreeUI Production)

A live, cinematic Three.js web application and startup founder platform built for **Sandip University, Nashik**.

---

## 🏛️ Project Structure

```
SEBC-ThreeUI/
│
├── src/
│   ├── components/           ← Reusable UI components & modals
│   ├── sections/             ← Landing page sections
│   ├── pages/                ← Sub-pages (Events, Team, Arcade, Register, Admin)
│   ├── styles/               ← Modular styling
│   ├── assets/               ← Application assets
│   ├── App.jsx               ← Main Application router & shell
│   ├── App.css               ← Responsive styles & animations
│   └── main.jsx              ← React entry point
│
├── public/
│   ├── games/
│   │   ├── sublevel-defender/← Game 1: Retro space shooter (Mobile Touch + Laptop)
│   │   │   └── index.html
│   │   └── basketball/       ← Game 2: 3D SBLVL SHOT (Hoop physics & drag throw)
│   │       └── index.html
│   ├── landing-pages/        ← 3D Kage cinematic landing page
│   ├── secret-pathways-assets/ ← Three.js textures, shaders & models
│   ├── sublevel-studio/      ← Sublevel studio interactive games
│   ├── sandip-university-logo.png
│   └── favicon.svg
│
├── vercel.json               ← Production SPA & game rewrite configuration
├── vite.config.js            ← Vite build configuration
├── package.json
│
├── backup/
│   └── original-source/      ← Untouched 4.47MB master source reference backup
│       └── index.html
│
└── README.md
```

---

## 🕹️ Integrated Arcade Games

Inside the **ARCADE** section (`/#/arcade`), both games operate as 100% sandboxed, independent experiences:

1. **Sublevel Defender** (`/games/sublevel-defender/`):
   - Retro 2D pixel space shooter with laser cannons, particle explosions, lives system, high-score tracking, and CRT scanlines.
   - **Mobile Controls**: Responsive on-screen touch buttons (`◄ LEFT`, `RIGHT ►`, `► START`, `● FIRE`) with haptic active feedback.
   - **Desktop Controls**: Keyboard arrow keys `←` / `→` or `A` / `D`, `Space` / `↑` to fire, and `ESC` to leave.

2. **SBLVL SHOT (Basketball)** (`/games/basketball/`):
   - Full 3D basketball court experience built with Three.js.
   - Real-time parabolic projectile physics, rim collision reflection, backboard bounce, net geometry, and `SWISH!` / `BUCKET!` scoring HUD.
   - **Controls**: Drag up on the ball to aim & power shoot, `Space` for quick throw, and `R` / `ESC` to reset.

---

## 🚀 Local Development & Build

```bash
# Run local dev server
npm run dev

# Build for production
npm run build
```

---

## ☁️ Vercel Deployment

- **Framework Preset**: Vite
- **Root Directory**: `./` (or leave default)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

## 👨‍💻 Credits & Team
**Sandip Entrepreneurship & Business Club (SEBC × SUN)**  
*SCIIE Hub, Block-B, Sandip University, Nashik, Maharashtra*

Built by the **SEBC Technical Team**  
**Made with ❤️ by Jayesh, Ashirwad, Praveen**
