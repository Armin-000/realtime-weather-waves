
<div align="center">

<img src="public/github.svg" width="160" />

# Oceanis

<div align="center">

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-Oceanis-0a84ff?style=for-the-badge&logo=vercel&logoColor=white)](https://realtime-weather-waves.vercel.app/)

[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Architecture-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WebGL](https://img.shields.io/badge/WebGL-GPU_Rendering-red?style=for-the-badge)]()

</div>

<p align="center">
  <i>Real-time cinematic ocean and atmosphere simulation driven by live weather and marine conditions.</i>
</p>

<br>

<img src="public/day.gif" width="30%" />
&nbsp;&nbsp;
<img src="public/Sunrise.gif" width="30%" />
&nbsp;&nbsp;
<img src="public/night.gif" width="30%" />

</div>

<p align="center">
  🌊 <b>Live Experience</b><br><br>
  <a href="https://realtime-weather-waves.vercel.app/">
    https://realtime-weather-waves.vercel.app/
  </a>
</p>

---

## Overview

Oceanis is a cinematic real-time ocean and atmosphere simulation built with Three.js, WebGL and TypeScript.

The project combines:

- live weather data
- marine conditions
- GPU accelerated rendering
- procedural ocean animation
- atmospheric environmental systems

to create an immersive real-time ocean experience.

Oceanis is intentionally designed as an atmospheric visualization engine rather than a traditional weather dashboard.

---

## Features

- Real-time weather integration
- Real-time marine simulation
- GPU accelerated ocean rendering
- Procedural cinematic waves
- Dynamic storm atmosphere
- Real-time rain system
- Cinematic cloud rendering
- Infinite ocean illusion
- Infinite horizon system
- Dynamic day and night transitions
- Procedural night sky
- Floating cinematic compass HUD
- Smart location autocomplete
- Glassmorphism environmental UI
- Atmospheric fog and lighting
- Modular TypeScript architecture

---

## APIs

Oceanis uses live Open-Meteo APIs:

<div align="center">

| API | Usage |
|---|---|
| Open-Meteo Forecast API | Weather conditions |
| Open-Meteo Marine API | Marine and wave data |
| Open-Meteo Geocoding API | Smart location search |

</div>

---

## Environmental Systems

Oceanis dynamically reacts to:

- wind speed
- wind direction
- wave height
- storm intensity
- precipitation
- cloud cover
- sunrise and sunset
- marine conditions
- atmospheric visibility

The environment continuously adapts in real time using live Open-Meteo APIs.

---

## Rendering Pipeline

Oceanis combines:

- GPU wave deformation
- procedural ocean animation
- cinematic sky rendering
- dynamic storm atmosphere
- weather-reactive lighting
- procedural clouds
- rain particle simulation
- atmospheric fog
- infinite environment illusion

The rendering pipeline is optimized for cinematic immersion while maintaining real-time performance.

---

## Technologies

<div align="center">

| Technology | Purpose |
|---|---|
| Three.js | 3D rendering engine |
| WebGL | GPU accelerated rendering |
| GLSL Shaders | GPU wave deformation |
| TypeScript | Application architecture |
| Vite | Development environment |
| Open-Meteo APIs | Weather and marine data |

</div>

---

## Project Structure

```txt
src/
├── environment/
│   ├── CloudLayer.ts
│   ├── HorizonSilhouettes.ts
│   ├── RainSystem.ts
│   └── StormAtmosphere.ts
│
├── panel/
│   └── panelBuilder.ts
│
├── water/
│   └── weatherWaves.ts
│
├── weather/
│   └── weatherService.ts
│
├── main.ts
└── style.css
````

---

## Installation

```bash id="7vxqmi"
npm install
npm run dev
```

---

## Build

```bash id="qj91y0"
npm run build
```

---

## Preview Production Build

```bash id="khnk6v"
npm run preview
```

---

## Recommended Test Locations

<div align="center">

| Scenario               | Locations                   |
| ---------------------- | --------------------------- |
| Heavy ocean conditions | Nuuk, Reykjavik, Tórshavn   |
| Calm sea conditions    | Split, Zadar, Silba         |
| Storm atmosphere       | Bergen, Tórshavn, Nuuk      |
| Sunset rendering       | Amsterdam, Oslo, London     |
| Night atmosphere       | South Pole, McMurdo Station |

</div>

---

## Future Improvements

### Visual

* lightning simulation
* volumetric clouds
* realistic ocean foam
* spray particles
* SSR reflections
* cinematic bloom
* underwater rendering
* atmospheric haze

### Physics

* Gerstner waves
* FFT ocean simulation
* buoyancy physics
* dynamic wakes
* WebGPU compute shaders

### UI

* marine radar
* tide system
* swell graphs
* weather icons
* historical weather playback
* cinematic minimap
* fullscreen immersive mode

---

## License

Oceanis is protected under a custom non-commercial license.

Commercial usage, redistribution, resale,
or use in paid products or services is prohibited
without explicit written permission from the author.

© 2026 Armin Lišić