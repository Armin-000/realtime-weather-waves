
<div align="center">

# Realtime Weather Waves

### Cinematic real-time ocean simulation powered by live weather and marine data

<br>

<img src="./public/day.png" width="44%" />
<img src="./public/night.png" width="44%" />

<br><br>

</div>

---

## Features

<table align="center">
<tr>
<td align="center" width="33%">

### Live Weather

Real-time weather conditions using the Open-Meteo Forecast API.

</td>

<td align="center" width="33%">

### Marine Data

Dynamic ocean simulation powered by real marine conditions.

</td>

<td align="center" width="33%">

### Day & Night Cycle

Automatic sunrise, daylight, sunset and night transitions.

</td>
</tr>

<tr>
<td align="center">

### Wind Simulation

Animated wind visualization reacting to live wind direction and speed.

</td>

<td align="center">

### Interactive Dashboard

Worldwide location search with real-time environmental data.

</td>

<td align="center">

### Atmospheric Rendering

Fog, moonlight, stars and cinematic environmental effects.

</td>
</tr>
</table>

---

## APIs

| API | Purpose |
|---|---|
| Open-Meteo Forecast API | Temperature, wind, sunrise and sunset |
| Open-Meteo Marine API | Wave height, wave direction and swell |
| Open-Meteo Geocoding API | Location search and coordinates |

---

## Technologies

<div align="center">

`Three.js` • `WebGL` • `JavaScript` • `Vite` • `Open-Meteo APIs`

</div>

---

## Project Structure

```txt
src/
├── weather/
│   └── weatherService.js
├── water/
│   └── weatherWaves.js
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

| Environment | Locations |
|---|---|
| Storm & Large Waves | Tórshavn, Reykjavik, Nuuk |
| Sunset Atmosphere | London, Amsterdam, Brussels |
| Bright Daylight | Dubai, Singapore, Tokyo |
| Adriatic Sea | Rijeka, Split, Silba |

---

## Planned Features

- Rain particle system
- Lightning effects
- Ocean foam simulation
- Volumetric clouds
- Advanced Gerstner waves
- Dynamic storms
- SSR reflections

---

<div align="center">

MIT License

</div>