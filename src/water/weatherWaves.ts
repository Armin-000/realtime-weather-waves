import * as THREE from 'three'
import { Water } from 'three/examples/jsm/objects/Water.js'

export type WeatherDataForSeaState = {
  windSpeed?: number | null
  windDirection?: number | null
  waveHeight?: number | null
  windWaveHeight?: number | null
  swellWaveHeight?: number | null
  weatherCode?: number | null
}

export type SeaState = {
  label: string; description: string
  className: 'calm' | 'light' | 'strong' | 'storm'
  intensity: number; stormIntensity: number
  waveHeight: number; visibleWaveHeight: number
  waveSpeed: number; waveFrequency: number; choppiness: number
  distortionScale: number; waveSize: number; waveAnimationSpeed: number
  waterColor: number; fogColor: number; fogDensity: number
  windDirection: number
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
const roundWave = (v: number) => Math.round(v * 10) / 10
const cinematicWaveHeight = (w: number) => clamp(Math.pow(w, 1.12) * 0.95, 0.12, 8)
const safeNum = (v: unknown, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback

const RAIN_CODES = [51, 53, 55, 61, 63, 65, 80, 81, 82]
const STORM_CODES = [95, 96, 99]

const STATES = [
  {
    test: (w: number, h: number) => h >= 2.2 || w >= 45,
    label: 'Stormy sea', desc: 'The sea is rough, violent and highly unstable.',
    className: 'storm' as const,
    waveFallback: 2.2, visibleFallback: 2.8,
    waterColor: 0x0d1518, fogColor: 0x1c2628,
    p: (i: number) => ({
      waveSpeed: 2.8 + i * 1.2, waveFrequency: 0.0055 + i * 0.0025,
      choppiness: 1.8 + i * 1.1, distortionScale: 20 + i * 18,
      waveSize: 1.2 - i * 0.35, waveAnimationSpeed: 2.8 + i * 2.1,
      fogDensity: 0.00045 + i * 0.00042,
    }),
  },
  {
    test: (w: number, h: number) => h >= 1.2 || w >= 25,
    label: 'Rough sea', desc: 'The sea reacts strongly to the wind with larger waves.',
    className: 'strong' as const,
    waveFallback: 1.1, visibleFallback: 1.6,
    waterColor: 0x132127, fogColor: 0x405761,
    p: (i: number) => ({
      waveSpeed: 1.9 + i * 0.95, waveFrequency: 0.0042 + i * 0.002,
      choppiness: 1.15 + i * 0.8, distortionScale: 12 + i * 13,
      waveSize: 2.2 - i * 0.55, waveAnimationSpeed: 1.8 + i * 1.6,
      fogDensity: 0.00018 + i * 0.00022,
    }),
  },
  {
    test: (w: number, h: number) => h >= 0.5 || w >= 10,
    label: 'Light waves', desc: 'The sea surface is moving with moderate wave activity.',
    className: 'light' as const,
    waveFallback: 0.45, visibleFallback: 0.8,
    waterColor: 0x00243d, fogColor: 0x7a9db8,
    p: (i: number) => ({
      waveSpeed: 1.15 + i * 0.7, waveFrequency: 0.003 + i * 0.0014,
      choppiness: 0.7 + i * 0.5, distortionScale: 5.5 + i * 8.5,
      waveSize: 3.8 - i * 0.7, waveAnimationSpeed: 1 + i * 1.1,
      fogDensity: 0.00006 + i * 0.0001,
    }),
  },
  {
    test: () => true,
    label: 'Calm sea', desc: 'The sea is calm with soft rolling waves.',
    className: 'calm' as const,
    waveFallback: 0.18, visibleFallback: 0.3,
    waterColor: 0x001428, fogColor: 0x7a9db8,
    p: (i: number) => ({
      waveSpeed: 0.55 + i * 0.25, waveFrequency: 0.0018 + i * 0.0008,
      choppiness: 0.22 + i * 0.2, distortionScale: 1.4 + i * 2.2,
      waveSize: 5.5 - i * 0.45, waveAnimationSpeed: 0.35 + i * 0.35,
      fogDensity: 0.00003,
    }),
  },
]

export function mapWindToSeaState(windSpeed = 0, realWaveHeight: number | null = null): SeaState {
  const wave = realWaveHeight != null && Number.isFinite(Number(realWaveHeight)) ? Number(realWaveHeight) : 0
  const wind = safeNum(windSpeed)
  const hasWave = realWaveHeight != null
  const windFactor = clamp(wind / 70, 0, 1)
  const waveFactor = hasWave ? clamp(wave / 3.5, 0, 1) : windFactor
  const intensity = clamp(Math.max(windFactor, waveFactor), 0.16, 1)

  const s = STATES.find(s => s.test(wind, wave))!
  const p = s.p(intensity)

  return {
    label: s.label, className: s.className, intensity, stormIntensity: intensity,
    windDirection: 315,
    waveHeight: hasWave ? wave : s.waveFallback,
    visibleWaveHeight: hasWave ? roundWave(cinematicWaveHeight(wave)) : s.visibleFallback,
    description: hasWave ? `Real wave height is around ${roundWave(wave)} m. ${s.label}.` : s.desc,
    waterColor: s.waterColor, fogColor: s.fogColor,
    ...p,
  }
}

export function getStormIntensity(weather: WeatherDataForSeaState = {}): number {
  const code = Number(weather.weatherCode ?? 0)
  return clamp(
    clamp(safeNum(weather.windSpeed) / 70, 0, 0.45) +
    clamp(safeNum(weather.waveHeight) / 3.5, 0, 0.42) +
    clamp(safeNum(weather.windWaveHeight) / 2.5, 0, 0.16) +
    clamp(safeNum(weather.swellWaveHeight) / 3, 0, 0.16) +
    (RAIN_CODES.includes(code) ? 0.08 : 0) +
    (STORM_CODES.includes(code) ? 0.3 : 0),
    0, 1
  )
}

export function mapWeatherToSeaState(weather: WeatherDataForSeaState = {}): SeaState {
  const wind = safeNum(weather.windSpeed)
  const waveHeight = weather.waveHeight != null ? Number(weather.waveHeight) : null
  const base = mapWindToSeaState(wind, waveHeight)
  const storm = getStormIntensity(weather)
  const finalIntensity = clamp(base.intensity + clamp(storm - base.intensity * 0.2, 0, 0.75), 0.16, 1)
  const realWave = waveHeight ?? 0

  const className =
    finalIntensity >= 0.75 || wind >= 45 || realWave >= 2.2 ? 'storm' :
    finalIntensity >= 0.42 || wind >= 22 || realWave >= 1.1 ? 'strong' :
    finalIntensity >= 0.2  || wind >= 8  || realWave >= 0.4 ? 'light'  : 'calm'

  const labels = { storm: 'Stormy sea', strong: 'Rough sea', light: 'Light waves', calm: 'Calm sea' }
  const label = labels[className]

  return {
    ...base, label, className, intensity: finalIntensity, stormIntensity: storm,
    windDirection: safeNum(weather.windDirection ?? base.windDirection ?? 315),
    waveSpeed:          base.waveSpeed + storm * 0.85,
    waveFrequency:      base.waveFrequency + storm * 0.0025,
    choppiness:         base.choppiness + storm * 0.9,
    distortionScale:    base.distortionScale + storm * 10,
    waveSize:           clamp(base.waveSize - storm * 1.2, 0.8, 7),
    waveAnimationSpeed: base.waveAnimationSpeed + storm * 1.4,
    fogDensity:         base.fogDensity + storm * 0.0002,
    waterColor: className === 'storm' ? 0x0d1518 : className === 'strong' ? 0x132127 : base.waterColor,
    fogColor:   className === 'storm' ? 0x1c2628 : className === 'strong' ? 0x33444a  : base.fogColor,
    description: className === 'storm'
      ? `Storm conditions detected. Waves are around ${roundWave(base.visibleWaveHeight)} m and the sea is highly unstable.`
      : `Real wave height is around ${roundWave(base.visibleWaveHeight)} m. ${label}.`,
  }
}

export function applySeaStateToWater(water: Water, seaState: SeaState, scene: THREE.Scene | null = null) {
  Object.assign(water.userData, {
    waveHeight: seaState.waveHeight, waveSpeed: seaState.waveSpeed,
    waveFrequency: seaState.waveFrequency, choppiness: seaState.choppiness,
    stormIntensity: seaState.stormIntensity ?? seaState.intensity,
    windDirection: seaState.windDirection ?? 315,
    waveAnimationSpeed: seaState.waveAnimationSpeed,
  })
  const u = water.material.uniforms
  if (u.distortionScale) u.distortionScale.value = seaState.distortionScale
  if (u.size)           u.size.value            = seaState.waveSize
  if (u.waterColor)     u.waterColor.value.setHex(seaState.waterColor)
  if (scene) scene.fog = new THREE.FogExp2(seaState.fogColor, seaState.fogDensity)
}