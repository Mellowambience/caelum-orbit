# CAELUM ∅RBIT

**Real-time weather app with Latin terminology.**  
Built with React + [Open-Meteo](https://open-meteo.com/) — no API key required.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![Open-Meteo](https://img.shields.io/badge/API-Open--Meteo-green.svg)

---

## Features

- 🌤️ Real-time weather via [Open-Meteo](https://open-meteo.com/) (free, no key)
- 🗺️ Geolocation auto-detection with fallback to Roma
- 🔍 City search via [Nominatim](https://nominatim.openstreetmap.org/) geocoding
- 🌡️ Celsius / Fahrenheit toggle
- 📅 7-day forecast with Latin day names (`Dies Solis`, `Dies Lunae`, ...)
- 🛰️ Satellite / Standard view toggle
- 🔄 Auto-refresh every 10 minutes
- 🏛️ Latin weather terminology (`Serēna`, `Pluit`, `Tonat`, ...)

---

## Getting Started

```bash
npm install
npm start
```

Requires Node 18+. Uses Tailwind CSS via CDN (no build config needed for quick demo).

---

## Tech Stack

| Layer | Tech |
|-------|------|
| UI | React 18 + Tailwind CSS |
| Icons | Lucide React |
| Weather | Open-Meteo (WMO codes) |
| Geocoding | Nominatim (OpenStreetMap) |
| Bundler | Create React App / Vite |

---

## Credits

Conceived by [Mellowambience](https://github.com/Mellowambience).  
Latin weather terminology hand-curated from classical sources.

---

*Caelum scrutātur... ↺*
