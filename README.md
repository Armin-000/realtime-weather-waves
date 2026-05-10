
<div align="center">

# Weather Waves

Real-time cinematic ocean simulation driven by live weather and marine conditions.

<br>

<img src="./public/day.png" width="30%" />
&nbsp;&nbsp;
<img src="./public/sunset.png" width="30%" />
&nbsp;&nbsp;
<img src="./public/night.png" width="30%" />

</div>

---

## Overview

Weather Waves is a real-time environmental visualization project built with Three.js and WebGL.  
The application combines live atmospheric and marine data with physically animated ocean surfaces, dynamic lighting and cinematic rendering techniques.

The simulation reacts to real-world conditions including:

- wind speed and direction
- wave height and marine state
- sunrise and sunset cycles
- local time zones
- atmospheric visibility

---

## Features

- Real-time weather integration
- Dynamic ocean wave simulation
- Animated wind field rendering
- Automatic day and night transitions
- Procedural star field rendering
- Physically animated water geometry
- Interactive location search
- Cinematic lighting and atmospheric effects
- Marine condition visualization
- Responsive WebGL rendering pipeline

---

## Technologies

<div align="center">

| Technology | Purpose |
|---|---|
| Three.js | 3D rendering engine |
| WebGL | GPU rendering |
| JavaScript | Application logic |
| Vite | Development environment |
| Open-Meteo APIs | Weather and marine data |

</div>

---

## APIs

<div align="center">

| API | Usage |
|---|---|
| Open-Meteo Forecast API | Weather conditions |
| Open-Meteo Marine API | Wave and marine data |
| Open-Meteo Geocoding API | Location search |

</div>

---

## Project Structure

```txt
weather-waves/
├── public/
├── src/
│   ├── assets/
│   ├── panel/
│   │   └── panelBuilder.js
│   ├── water/
│   │   └── weatherWaves.js
│   ├── weather/
│   │   └── weatherService.js
│   ├── counter.js
│   ├── main.js
│   └── style.css
├── index.html
├── package.json
└── README.md
```

---

## Installation

```bash
npm install
npm run dev
```

---

## Recommended Test Locations

<div align="center">

| Scenario | Locations |
|---|---|
| Heavy ocean conditions | Nuuk, Reykjavik, Tórshavn |
| Calm sea | Split, Zadar, Silba |
| Night atmosphere | South Pole, McMurdo Station |
| Sunset rendering | Amsterdam, London, Oslo |

</div>

---

## Rendering Pipeline

The environment rendering system includes:

- dynamic sky scattering
- volumetric atmospheric transitions
- physically animated ocean mesh
- procedural wave deformation
- adaptive marine state simulation
- real-time wind visualization
- HDR-style tone mapping

---

## License

<div align="center">

MIT License

</div>
````
