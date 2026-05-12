
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

The project combines live weather data, marine conditions, GPU accelerated rendering and atmospheric environmental systems to create an immersive real-time ocean simulation.

Oceanis is designed as an atmospheric visualization experience rather than a traditional weather dashboard.

The environment dynamically reacts to:

- wind speed and direction
- marine wave intensity
- storm conditions
- atmospheric visibility
- sunrise and sunset cycles
- timezone changes
- environmental lighting
- dynamic ocean states

The scene continuously adapts in real time using live Open-Meteo weather and marine APIs.

---

## Features

- Real-time weather integration
- Real-time marine condition simulation
- GPU accelerated ocean rendering
- Physically animated 3D ocean waves
- Custom GPU vertex shader deformation
- Weather-reactive wave simulation
- Cinematic atmosphere rendering
- Dynamic wind visualization system
- Automatic day and night transitions
- Procedural night sky rendering
- Floating cinematic compass HUD
- Smart location autocomplete search
- Expandable compact control panel
- Glassmorphism environmental interface
- Dynamic fog and lighting system
- Responsive WebGL rendering pipeline
- Modular TypeScript architecture
- Atmospheric environmental transitions

---

## Cinematic HUD System

Oceanis uses a modular cinematic HUD interface instead of a traditional dashboard UI.

The interface consists of:

- compact expandable weather panel
- floating compass overlay
- atmospheric glassmorphism styling
- contextual marine visualization
- smart location autocomplete system

The HUD is intentionally designed to remain:

- cinematic
- immersive
- non-intrusive
- responsive
- atmospheric

The compass system is separated from the main panel to preserve immersion and maximize viewport visibility.

---

## GPU Ocean System

Oceanis uses a GPU accelerated ocean rendering pipeline built on top of Three.js Water shaders.

The ocean surface is dynamically displaced inside the GPU vertex shader using:

- wave height uniforms
- storm intensity uniforms
- procedural sine wave deformation
- weather-reactive GPU calculations

Wave behavior dynamically reacts to:

- real marine wave height
- wind speed
- storm intensity
- ocean state classification

The rendering pipeline combines:

- CPU-side environmental logic
- GPU-side vertex displacement
- shader-based wave animation
- atmospheric rendering systems

This allows Oceanis to render large-scale animated ocean surfaces efficiently in real time.

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

## APIs

<div align="center">

| API | Usage |
|---|---|
| Open-Meteo Forecast API | Weather conditions |
| Open-Meteo Marine API | Marine and wave data |
| Open-Meteo Geocoding API | Smart location search |

</div>

---

## Architecture

Oceanis combines multiple real-time systems:

- Three.js rendering engine
- GPU shader-based ocean simulation
- TypeScript modular architecture
- Real-time Open-Meteo integration
- Atmospheric scattering system
- Dynamic marine state classification
- Procedural environmental effects

The rendering system separates:

- weather data acquisition
- marine state simulation
- GPU wave rendering
- HUD rendering
- atmospheric lighting
- environmental transitions

---

## Project Structure

```txt
oceanis/
├── public/
│   ├── github.svg
│   ├── oceanis-dark.svg
│   ├── oceanis-light.svg
│   ├── day.gif
│   ├── Sunrise.gif
│   └── night.gif
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
├── AI_CONTEXT.md
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
* GPU vertex wave displacement
* shader-based ocean deformation
* weather-reactive wave uniforms
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

## Environmental Systems

### Ocean System

The ocean simulation dynamically reacts to:

* wind speed
* wave height
* storm intensity
* swell activity
* marine state transitions

The wave simulation modifies:

* distortion scale
* wave animation speed
* wave frequency
* water color
* fog density
* ocean turbulence

---

### Atmosphere System

The atmosphere system dynamically controls:

* sunlight intensity
* moon lighting
* sky scattering
* atmospheric fog
* star visibility
* sunrise and sunset transitions

Supported phases:

* night
* sunrise
* day
* sunset

---

### Wind Visualization System

Oceanis includes a procedural wind ribbon system that visualizes atmospheric flow in real time.

The system uses:

* transparent additive planes
* animated directional movement
* weather-reactive speed scaling
* atmospheric blending

---

## Performance

Oceanis uses GPU accelerated rendering techniques to maintain real-time performance while simulating:

* animated ocean deformation
* atmospheric transitions
* procedural star fields
* dynamic wind visualization
* weather-reactive lighting

The ocean simulation offloads wave deformation directly to the GPU shader pipeline, reducing CPU load and improving rendering scalability.

---

## Development Stack

* Three.js
* TypeScript
* WebGL
* GLSL
* Vite
* Open-Meteo APIs

---

## Future Improvements

### Visual

* rain particle systems
* lightning simulation
* volumetric clouds
* ocean foam rendering
* spray particles
* SSR reflections
* cinematic post-processing
* underwater fog
* atmospheric haze

### Physics

* Gerstner waves
* FFT ocean simulation
* buoyancy physics
* dynamic foam generation
* GPU compute wave simulation
* WebGPU compute shaders

### UI

* favorite locations
* marine radar
* tide system
* swell graphs
* weather icons
* historical weather playback
* animated marine minimap
* cinematic waypoint markers
* advanced atmospheric HUD
* ocean telemetry overlay
* fullscreen immersive mode

---

## License

Oceanis is protected under a custom non-commercial license.

Commercial usage, redistribution, resale,
or use in paid products or services is prohibited
without explicit written permission from the author.

© 2026 Armin Lišić

---
