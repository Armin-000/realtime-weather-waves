
<div align="center">

<img src="public/github.svg" width="160" />

# Oceanis

Real-time cinematic ocean simulation driven by live weather and marine conditions.

<br>

<img src="public/day.png" width="30%" />
&nbsp;&nbsp;
<img src="public/sunset.png" width="30%" />
&nbsp;&nbsp;
<img src="public/night.png" width="30%" />

</div>

---

## Overview

Oceanis is a cinematic real-time ocean and atmosphere simulation built using Three.js, WebGL and TypeScript.

The application combines live weather and marine conditions with physically animated ocean surfaces, procedural environmental effects and dynamic atmospheric rendering.

The simulation reacts to real-world environmental data including:

- wind speed and direction
- marine wave intensity
- storm conditions
- sunrise and sunset cycles
- local timezone changes
- atmospheric visibility
- dynamic ocean response

---

## Features

- Real-time weather integration
- Real-time marine condition simulation
- Physically animated 3D ocean waves
- Dynamic wind field visualization
- Automatic day and night transitions
- Procedural night sky rendering
- Interactive location search
- Cinematic atmosphere rendering
- Dynamic fog and lighting system
- Responsive WebGL rendering pipeline
- TypeScript-based architecture
- Modular rendering system

---

## Technologies

<div align="center">

| Technology | Purpose |
|---|---|
| Three.js | 3D rendering engine |
| WebGL | GPU accelerated rendering |
| TypeScript | Application architecture |
| Vite | Development environment |
| Open-Meteo APIs | Weather and marine data |

</div>

---

## APIs

<div align="center">

| API | Usage |
|---|---|
| Open-Meteo Forecast API | Weather conditions |
| Open-Meteo Marine API | Marine and wave data |
| Open-Meteo Geocoding API | Location search |

</div>

---

## Project Structure

```txt
oceanis/
├── public/
│   ├── github.svg
│   ├── oceanis-dark.svg
│   ├── oceanis-light.svg
│   ├── day.png
│   ├── sunset.png
│   └── night.png
│
├── src/
│   ├── panel/
│   │   └── panelBuilder.ts
│   │
│   ├── water/
│   │   └── weatherWaves.ts
│   │
│   ├── weather/
│   │   └── weatherService.ts
│   │
│   ├── main.ts
│   └── style.css
│
├── index.html
├── tsconfig.json
├── package.json
├── vite.config.js
└── README.md
````

---

## Installation

```bash
npm install
npm run dev
```

---

## Build

```bash
npm run build
```

---

## Type Checking

```bash
npm run typecheck
```

---

## Preview Production Build

```bash
npm run preview
```

---

## Recommended Test Locations

<div align="center">

| Scenario               | Locations                   |
| ---------------------- | --------------------------- |
| Heavy ocean conditions | Nuuk, Reykjavik, Tórshavn   |
| Calm sea conditions    | Split, Zadar, Silba         |
| Night atmosphere       | South Pole, McMurdo Station |
| Sunset rendering       | Amsterdam, London, Oslo     |

</div>

---

## Rendering Pipeline

Oceanis includes:

* procedural ocean deformation
* physically animated wave motion
* real-time wind visualization
* adaptive marine simulation
* dynamic atmospheric scattering
* cinematic tone mapping
* procedural star field rendering
* volumetric environmental transitions
* dynamic fog rendering
* weather-reactive lighting system

---

## Development Stack

* Three.js
* TypeScript
* WebGL
* Vite
* Open-Meteo APIs

---

## License

<div align="center">

MIT License

</div>