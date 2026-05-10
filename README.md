
<div align="center">

<img src="public/github.svg" width="160" />

# Oceanis

Real-time cinematic ocean and atmosphere simulation driven by live weather and marine conditions.

<br>

<img src="public/day.png" width="30%" />
&nbsp;&nbsp;
<img src="public/sunset.png" width="30%" />
&nbsp;&nbsp;
<img src="public/night.png" width="30%" />

</div>

---

## Overview

Oceanis is a cinematic real-time ocean and atmospheric simulation built with Three.js, WebGL and TypeScript.

The project combines live weather and marine conditions with GPU accelerated ocean rendering, physically animated wave deformation and procedural environmental effects.

Oceanis dynamically reacts to real-world environmental conditions including:

- wind speed and wind direction
- marine wave intensity
- storm conditions
- sunrise and sunset cycles
- local timezone changes
- atmospheric visibility
- dynamic ocean state

The environment continuously adapts in real time to incoming weather and marine API data.

---

## Features

- Real-time weather integration
- Real-time marine condition simulation
- GPU accelerated ocean rendering
- Physically animated 3D ocean waves
- Custom vertex shader wave deformation
- Weather-reactive GPU wave simulation
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

---

## Marine Conditions Dependency Chart

Oceanis analyzes the relationship between atmospheric and marine conditions in real time to determine the current ocean state and environmental intensity.

The system dynamically combines:

- wind speed
- wave height
- swell activity
- wind wave intensity
- storm severity
- atmospheric instability

to generate a real-time ocean response profile.

The chart visualizes how environmental conditions influence the behavior of the simulated ocean surface and atmospheric rendering pipeline.

<div align="center">

<img src="public/marine-conditions-chart.png" width="720" />

</div>

### Graph Interpretation

| Axis | Description |
|---|---|
| X Axis | Time progression / environmental sampling |
| Left Y Axis | Ocean wave intensity and wave height |
| Right Y Axis | Wind speed and marine energy |

### Environmental Relationship Analysis

| Condition | Effect on Ocean Simulation |
|---|---|
| Higher wind speed | Faster and more aggressive wave movement |
| Increased wave height | Larger GPU wave displacement |
| Storm intensity | Stronger ocean turbulence and atmospheric fog |
| Swell activity | Additional ocean motion layering |
| Calm conditions | Reduced deformation and smoother reflections |

### Example Marine Profile

| Month | Wave Height | Wind Speed | Ocean Risk |
|---|---:|---:|---:|
| January | 1.2 m | 28 km/h | 42% |
| February | 0.8 m | 18 km/h | 26% |
| March | 1.5 m | 34 km/h | 51% |
| April | 2.1 m | 48 km/h | 74% |
| May | 0.6 m | 12 km/h | 18% |
| June | 0.9 m | 20 km/h | 31% |
| July | 1.3 m | 25 km/h | 39% |
| August | 2.4 m | 55 km/h | 86% |
| September | 1.7 m | 38 km/h | 62% |
| October | 2.8 m | 63 km/h | 94% |
| November | 2.2 m | 51 km/h | 80% |
| December | 1.6 m | 36 km/h | 58% |

The dependency system allows Oceanis to produce a more believable and reactive cinematic ocean simulation driven by live environmental conditions.

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
- dynamic atmospheric rendering

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
| Open-Meteo Geocoding API | Location search |

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
- UI rendering
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
* dynamic atmospheric blending

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

Possible future upgrades include:

### Visual

* rain particle systems
* lightning simulation
* volumetric clouds
* ocean foam rendering
* spray particles
* SSR reflections
* cinematic post-processing

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

---

## License

<div align="center">

MIT License

</div>