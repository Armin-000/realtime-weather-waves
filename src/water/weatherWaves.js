import * as THREE from 'three'

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)
const roundWave = v => Math.round(v * 10) / 10

const RAIN_CODES = [51, 53, 55, 61, 63, 65, 80, 81, 82]
const STORM_CODES = [95, 96, 99]

const SEA_STATES = [
  {
    test: (wind, wave) => wave >= 2.2 || wind >= 45,
    label: 'Stormy sea',
    descFallback: 'The sea is rough, with aggressive and fast-moving waves.',
    className: 'storm',
    wave: { fallback: 1.2, visibleFallback: 2.6 },
    params: i => ({
      waveSpeed: 2.3 + i * 1.1,
      waveFrequency: 2.1 + i * 0.55,
      choppiness: 1.65 + i * 0.95,
      distortionScale: 18 + i * 16,
      waveSize: 1.65 - i * 0.65,
      waveAnimationSpeed: 2.5 + i * 1.9,
      waterColor: 0x10191b,
      fogColor: 0x1d2628,
      fogDensity: 0.00045 + i * 0.00035
    })
  },
  {
    test: (wind, wave) => wave >= 1.2 || wind >= 25,
    label: 'Rough sea',
    descFallback: 'The waves are higher and the sea clearly reacts to the wind.',
    className: 'strong',
    wave: { fallback: 0.75, visibleFallback: 1.45 },
    params: i => ({
      waveSpeed: 1.7 + i * 1.0,
      waveFrequency: 1.7 + i * 0.45,
      choppiness: 1.15 + i * 0.75,
      distortionScale: 12 + i * 12,
      waveSize: 2.2 - i * 0.9,
      waveAnimationSpeed: 1.8 + i * 1.5,
      waterColor: 0x0f2026,
      fogColor: 0x4d6370,
      fogDensity: 0.00018 + i * 0.00022
    })
  },
  {
    test: (wind, wave) => wave >= 0.5 || wind >= 10,
    label: 'Light waves',
    descFallback: 'The sea is moving slightly due to moderate wind.',
    className: 'light',
    wave: { fallback: 0.38, visibleFallback: 0.75 },
    params: i => ({
      waveSpeed: 1.15 + i * 0.8,
      waveFrequency: 1.35 + i * 0.25,
      choppiness: 0.75 + i * 0.55,
      distortionScale: 5.5 + i * 8.5,
      waveSize: 3.8 - i * 1.4,
      waveAnimationSpeed: 1.05 + i * 1.05,
      waterColor: 0x00243d,
      fogColor: 0x7a9db8,
      fogDensity: 0.00006 + i * 0.0001
    })
  },
  {
    test: () => true,
    label: 'Calm sea',
    descFallback: 'The waves are low and the sea is almost calm.',
    className: 'calm',
    wave: { fallback: 0.18, visibleFallback: 0.3 },
    params: i => ({
      waveSpeed: 0.55 + i * 0.35,
      waveFrequency: 0.85 + i * 0.15,
      choppiness: 0.28 + i * 0.32,
      distortionScale: 1.2 + i * 2.4,
      waveSize: 6.2 - i * 1.2,
      waveAnimationSpeed: 0.35 + i * 0.35,
      waterColor: 0x001428,
      fogColor: 0x7a9db8,
      fogDensity: 0.00003
    })
  }
]

export function mapWindToSeaState(windSpeed = 0, realWaveHeight = null) {
  const hasWave = realWaveHeight != null
  const wave = hasWave ? Number(realWaveHeight) : 0

  const safeWind = Number.isFinite(Number(windSpeed)) ? Number(windSpeed) : 0
  const safeWave = Number.isFinite(wave) ? wave : 0

  const wFactor = clamp(safeWind / 70, 0, 1)
  const waveFactor = hasWave ? clamp(safeWave / 3, 0, 1) : wFactor

  const intensity = clamp(Math.max(wFactor, waveFactor), 0.18, 1)
  const state = SEA_STATES.find(s => s.test(safeWind, safeWave))

  return {
    label: state.label,
    description: hasWave
      ? `Real wave height is around ${roundWave(safeWave)} m. ${state.label}.`
      : state.descFallback,
    className: state.className,
    intensity,
    stormIntensity: intensity,
    waveHeight: hasWave ? safeWave : state.wave.fallback,
    visibleWaveHeight: hasWave ? roundWave(safeWave) : state.wave.visibleFallback,
    ...state.params(intensity)
  }
}

export function getStormIntensity(weather = {}) {
  const windSpeed = Number(weather.windSpeed ?? 0)
  const waveHeight = Number(weather.waveHeight ?? 0)
  const windWaveHeight = Number(weather.windWaveHeight ?? 0)
  const swellWaveHeight = Number(weather.swellWaveHeight ?? 0)
  const weatherCode = Number(weather.weatherCode ?? 0)

  let intensity = 0

  intensity += clamp(windSpeed / 70, 0, 0.45)
  intensity += clamp(waveHeight / 3, 0, 0.4)
  intensity += clamp(windWaveHeight / 2.5, 0, 0.16)
  intensity += clamp(swellWaveHeight / 3, 0, 0.16)

  if (RAIN_CODES.includes(weatherCode)) intensity += 0.1
  if (STORM_CODES.includes(weatherCode)) intensity += 0.3

  return clamp(intensity, 0, 1)
}

export function mapWeatherToSeaState(weather = {}) {
  const windSpeed = Number(weather.windSpeed ?? 0)
  const waveHeight = weather.waveHeight != null ? Number(weather.waveHeight) : null

  const base = mapWindToSeaState(windSpeed, waveHeight)
  const storm = getStormIntensity(weather)

  const stormBoost = clamp(storm - base.intensity * 0.25, 0, 0.75)
  const finalIntensity = clamp(base.intensity + stormBoost, 0.18, 1)

  const realWave = waveHeight ?? 0

  const isStorm =
    finalIntensity >= 0.75 ||
    windSpeed >= 45 ||
    realWave >= 2.2

  const isRough =
    finalIntensity >= 0.42 ||
    windSpeed >= 22 ||
    realWave >= 0.85

  const isLight =
    finalIntensity >= 0.22 ||
    windSpeed >= 8 ||
    realWave >= 0.4

  const className = isStorm
    ? 'storm'
    : isRough
      ? 'strong'
      : isLight
        ? 'light'
        : 'calm'

  const label = isStorm
    ? 'Stormy sea'
    : isRough
      ? 'Rough sea'
      : isLight
        ? 'Light waves'
        : 'Calm sea'

  return {
    ...base,

    label,
    className,
    intensity: finalIntensity,
    stormIntensity: storm,

    waveSpeed: base.waveSpeed + storm * 0.75,
    waveFrequency: base.waveFrequency + storm * 0.45,
    choppiness: base.choppiness + storm * 0.85,

    distortionScale: base.distortionScale + storm * 9.5,
    waveSize: clamp(base.waveSize - storm * 1.4, 0.85, 7),

    waveAnimationSpeed: base.waveAnimationSpeed + storm * 1.25,

    fogDensity: base.fogDensity + storm * 0.00018,

    waterColor:
      isStorm ? 0x10191b :
      isRough ? 0x13272d :
      base.waterColor,

    fogColor:
      isStorm ? 0x1d2628 :
      isRough ? 0x33444a :
      base.fogColor,

    description: isStorm
      ? `Storm conditions detected. Waves are around ${roundWave(base.visibleWaveHeight)} m and the sea is highly unstable.`
      : `Real wave height is around ${roundWave(base.visibleWaveHeight)} m. ${label}.`
  }
}

export function applySeaStateToWater(water, seaState, scene = null) {
  Object.assign(water.userData, {
    waveHeight: seaState.waveHeight,
    waveSpeed: seaState.waveSpeed,
    waveFrequency: seaState.waveFrequency,
    choppiness: seaState.choppiness,
    stormIntensity: seaState.stormIntensity ?? seaState.intensity,
    windDirection: seaState.windDirection ?? 315,
    waveAnimationSpeed: seaState.waveAnimationSpeed
  })

  const u = water.material.uniforms

  if (u.distortionScale) {
    u.distortionScale.value = seaState.distortionScale
  }

  if (u.size) {
    u.size.value = seaState.waveSize
  }

  if (u.waterColor) {
    u.waterColor.value.setHex(seaState.waterColor)
  }

  if (scene) {
    scene.fog = new THREE.FogExp2(seaState.fogColor, seaState.fogDensity)
  }
}