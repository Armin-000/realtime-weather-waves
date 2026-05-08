# Realtime Weather Waves

<p align="center">
  Real-time cinematic ocean simulation powered by live weather and marine data.
</p>

---

## Preview

### Night Environment
![Night Preview](./weather-waves/public/day.png)

### Day Environment
![Day Preview](./weather-waves/public/night.png)

---

## Overview

Realtime Weather Waves is an advanced real-time 3D ocean simulation built with Three.js and WebGL.

The application dynamically reacts to live meteorological and marine conditions by adjusting:
- ocean wave intensity
- atmospheric lighting
- day/night transitions
- wind direction and movement
- water distortion
- fog density
- environmental colors

The system combines live weather data with cinematic rendering techniques to create an immersive ocean environment directly in the browser.

---

## Features

### Real-Time Weather Integration
Live environmental data is fetched from the Open-Meteo APIs:
- temperature
- wind speed
- wind direction
- sunrise & sunset
- timezone
- marine wave data

---

### Dynamic Ocean Simulation
Ocean behavior changes in real time depending on:
- wind intensity
- wave height
- marine conditions

The water system dynamically adjusts:
- wave speed
- wave size
- distortion scale
- fog density
- ocean color

---

### Adaptive Day & Night Cycle
The environment automatically transitions between:
- sunrise
- daytime
- sunset
- nighttime

Lighting and atmosphere dynamically react to real-world solar conditions.

---

### Cinematic Night Rendering
Night scenes include:
- realistic moon rendering
- atmospheric moon glow
- animated stars
- moonlight reflections
- dark ocean atmosphere

---

### Marine Data Visualization
The application visualizes:
- real wave height
- wave direction
- wave period
- wind wave data
- swell wave data

using the Open-Meteo Marine API.

---

### Wind Visualization System
Animated wind ribbons simulate atmospheric movement based on:
- wind speed
- wind direction
- weather intensity

---

### Interactive Weather Dashboard
Users can search any location worldwide:
- Rijeka
- Split
- Silba
- Tórshavn
- Reykjavik
- Washington
- etc.

The dashboard displays:
- local time
- coordinates
- weather conditions
- marine conditions
- compass direction
- ocean state

---

## Technologies

- Three.js
- WebGL
- JavaScript
- Vite
- Open-Meteo API
- Open-Meteo Marine API

---

## APIs

### Open-Meteo Forecast API
Used for:
- temperature
- wind
- sunrise/sunset
- timezone
- day/night state

```txt
https://api.open-meteo.com/v1/forecast
```

### Open-Meteo Marine API
Used for:
- wave height
- wave direction
- wave period
- swell data
- marine conditions

```txt
https://marine-api.open-meteo.com/v1/marine
```

### Open-Meteo Geocoding API
Used for:
- location search
- coordinates
- timezone detection

```txt
https://geocoding-api.open-meteo.com/v1/search
```

---

## Project Structure

```text
src/
│
├── weather/
│   └── weatherService.js
│
├── water/
│   └── weatherWaves.js
│
├── main.js
├── style.css
└── index.html
```

---

## Installation

```bash
npm install
npm run dev
```

---

## Recommended Test Locations

### Storm & Large Waves
```txt
Tórshavn
Reykjavik
Nuuk
Ushuaia
Cape Town
```

### Adriatic Sea
```txt
Rijeka
Split
Silba
Zadar
Dubrovnik
```

---

## Notes

The current ocean implementation uses the built-in Three.js Water shader system.

Wave height from the Marine API is used to dynamically enhance:
- distortion
- wave movement
- atmosphere
- environmental intensity

The project currently focuses on:
- cinematic realism
- atmospheric rendering
- responsive environmental simulation

rather than physically simulated FFT or Gerstner ocean waves.

---

## Future Improvements

Planned upgrades:
- rain particle system
- lightning effects
- volumetric clouds
- ocean foam
- Gerstner wave simulation
- dynamic storms
- SSR reflections
- advanced ocean shaders

---

## License

MIT License