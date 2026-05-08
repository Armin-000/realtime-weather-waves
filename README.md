# Realtime Weather Waves

Realtime Weather Waves is an interactive real-time 3D ocean simulation built with Three.js. The application dynamically reacts to live weather conditions by adjusting ocean waves, atmospheric lighting, wind behavior, and environmental transitions based on real meteorological data.

The project integrates live weather information from the Open-Meteo API and visualizes changing environmental conditions through a fully animated ocean scene.

---

## Overview

The application simulates a responsive marine environment where multiple visual systems adapt in real time according to weather data for Rijeka, Croatia.

The environment dynamically updates:
- ocean wave intensity
- wind movement and direction
- atmospheric conditions
- sunrise and sunset transitions
- night sky rendering
- moonlight illumination
- real-time local time

The project is designed as a modern Three.js visualization focused on realism, atmosphere, and weather-driven environmental behavior.

---

## Features

### Real-Time Weather Integration

Weather data is fetched directly from the Open-Meteo API, including:
- temperature
- wind speed
- wind direction
- sunrise and sunset times
- day and night state

The ocean environment updates automatically according to live conditions.

### Dynamic Ocean Simulation

Wave behavior changes depending on the current wind intensity:
- calm sea during weak winds
- stronger and faster waves during heavy winds
- dynamic surface distortion and movement

### Adaptive Day and Night Cycle

The application automatically transitions between:
- daytime
- sunrise
- sunset
- nighttime

Lighting, fog, atmospheric scattering, water colors, and sky appearance adapt dynamically.

### Night Environment

During nighttime conditions the scene renders:
- a realistic moon with texture mapping
- moon glow and atmospheric halo
- animated stars
- moonlight reflections and illumination over the ocean

### Wind Visualization System

The wind system visualizes atmospheric movement using animated translucent wind streaks that react to:
- wind speed
- wind direction
- environmental intensity

### Real-Time Clock

The interface continuously displays the current local time for Rijeka, Croatia without requiring page refreshes.

---

## Technologies

- Three.js
- JavaScript
- Vite
- Open-Meteo API
- WebGL

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