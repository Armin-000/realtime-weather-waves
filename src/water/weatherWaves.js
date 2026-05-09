import * as THREE from 'three'

const clamp     = (v, lo, hi) => Math.min(Math.max(v, lo), hi)
const roundWave = v => Math.round(v * 10) / 10

const SEA_STATES = [
  {
    test:        (wind, wave) => wave >= 2.2 || wind >= 45,
    label:       'Stormy sea',
    descFallback:'The sea is rough, with aggressive and fast-moving waves.',
    className:   'storm',
    wave:        { fallback: 1.05, visibleFallback: 2.4 },
    params:      i => ({ waveSpeed: 1.8 + i*0.8, waveFrequency: 1.75 + i*0.4, choppiness: 1.25 + i*0.75,
                         distortionScale: 12 + i*12, waveSize: 2.0 - i*0.8, waveAnimationSpeed: 1.9 + i*1.5,
                         waterColor: 0x1e2c2c, fogColor: 0x273437, fogDensity: 0.00035 + i*0.00025 })
  },
  {
    test:        (wind, wave) => wave >= 1.2 || wind >= 25,
    label:       'Rough sea',
    descFallback:'The waves are higher and the sea clearly reacts to the wind.',
    className:   'strong',
    wave:        { fallback: 0.62, visibleFallback: 1.35 },
    params:      i => ({ waveSpeed: 1.2 + i*0.7, waveFrequency: 1.35 + i*0.35, choppiness: 0.85 + i*0.55,
                         distortionScale: 7 + i*8, waveSize: 3.2 - i*1.2, waveAnimationSpeed: 1.2 + i*1.1,
                         waterColor: 0x0f2026, fogColor: 0x4d6370, fogDensity: 0.00016 + i*0.00018 })
  },
  {
    test:        (wind, wave) => wave >= 0.5 || wind >= 10,
    label:       'Light waves',
    descFallback:'The sea is moving slightly due to moderate wind.',
    className:   'light',
    wave:        { fallback: 0.32, visibleFallback: 0.65 },
    params:      i => ({ waveSpeed: 0.75 + i*0.5, waveFrequency: 1.05, choppiness: 0.45 + i*0.35,
                         distortionScale: 2.5 + i*4.5, waveSize: 5.3 - i*1.5, waveAnimationSpeed: 0.55 + i*0.6,
                         waterColor: 0x00243d, fogColor: 0x7a9db8, fogDensity: 0.00005 + i*0.00008 })
  },
  {
    test:        () => true,
    label:       'Calm sea',
    descFallback:'The waves are low and the sea is almost calm.',
    className:   'calm',
    wave:        { fallback: 0.16, visibleFallback: 0.25 },
    params:      i => ({ waveSpeed: 0.45 + i*0.25, waveFrequency: 0.75, choppiness: 0.2 + i*0.25,
                         distortionScale: 0.7 + i*1.8, waveSize: 6.8 - i, waveAnimationSpeed: 0.22 + i*0.25,
                         waterColor: 0x001428, fogColor: 0x7a9db8, fogDensity: 0.00003 })
  }
]

export function mapWindToSeaState(windSpeed = 0, realWaveHeight = null) {
  const hasWave  = realWaveHeight != null
  const wave     = hasWave ? Number(realWaveHeight) : 0
  const wFactor  = clamp(windSpeed / 80, 0, 1)
  const intensity = clamp(Math.max(wFactor, hasWave ? clamp(wave / 4, 0, 1) : wFactor), 0.15, 1)

  const state = SEA_STATES.find(s => s.test(windSpeed, wave))

  return {
    label:       state.label,
    description: hasWave
      ? `Real wave height is around ${roundWave(wave)} m. ${state.label}.`
      : state.descFallback,
    className:   state.className,
    intensity,
    waveHeight:        hasWave ? wave : state.wave.fallback,
    visibleWaveHeight: hasWave ? roundWave(wave) : state.wave.visibleFallback,
    ...state.params(intensity)
  }
}

export function applySeaStateToWater(water, seaState, scene = null) {
  Object.assign(water.userData, {
    waveHeight:        seaState.waveHeight,
    waveSpeed:         seaState.waveSpeed,
    waveFrequency:     seaState.waveFrequency,
    choppiness:        seaState.choppiness,
    windDirection:     seaState.windDirection ?? 315,
    waveAnimationSpeed: seaState.waveAnimationSpeed
  })

  const u = water.material.uniforms
  if (u.distortionScale) u.distortionScale.value = seaState.distortionScale
  if (u.size)            u.size.value            = seaState.waveSize
  if (u.waterColor)      u.waterColor.value.setHex(seaState.waterColor)

  if (scene) scene.fog = new THREE.FogExp2(seaState.fogColor, seaState.fogDensity)
}