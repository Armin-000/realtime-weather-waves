import * as THREE from 'three'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function roundWave(value) {
  return Math.round(value * 10) / 10
}

export function mapWindToSeaState(windSpeed = 0, realWaveHeight = null) {
  const hasRealWave = realWaveHeight !== null && realWaveHeight !== undefined
  const wave = hasRealWave ? Number(realWaveHeight) : 0

  const windFactor = clamp(windSpeed / 80, 0, 1)
  const waveFactor = hasRealWave
    ? clamp(wave / 4, 0, 1)
    : windFactor

  const intensity = clamp(Math.max(windFactor, waveFactor), 0.15, 1)

  if (wave >= 2.2 || windSpeed >= 45) {
    return {
      label: 'Olujno more',
      description: hasRealWave
        ? `Stvarna visina valova je oko ${roundWave(wave)} m. More je vrlo nemirno.`
        : 'More je nemirno, valovi su agresivni i brzi.',
      className: 'storm',

      intensity,

      waveHeight: hasRealWave ? wave : 1.05,
      visibleWaveHeight: hasRealWave ? roundWave(wave) : 2.4,

      waveSpeed: 1.8 + intensity * 0.8,
      waveFrequency: 1.75 + intensity * 0.4,
      choppiness: 1.25 + intensity * 0.75,

      distortionScale: 12 + intensity * 12,
      waveSize: 2.0 - intensity * 0.8,
      waveAnimationSpeed: 1.9 + intensity * 1.5,

      waterColor: 0x1e2c2c,
      fogColor: 0x273437,
      fogDensity: 0.00035 + intensity * 0.00025
    }
  }

  if (wave >= 1.2 || windSpeed >= 25) {
    return {
      label: 'Jako valovito',
      description: hasRealWave
        ? `Stvarna visina valova je oko ${roundWave(wave)} m. More jako reagira na uvjete.`
        : 'Valovi su viši i more jasno reagira na vjetar.',
      className: 'strong',

      intensity,

      waveHeight: hasRealWave ? wave : 0.62,
      visibleWaveHeight: hasRealWave ? roundWave(wave) : 1.35,

      waveSpeed: 1.2 + intensity * 0.7,
      waveFrequency: 1.35 + intensity * 0.35,
      choppiness: 0.85 + intensity * 0.55,

      distortionScale: 7 + intensity * 8,
      waveSize: 3.2 - intensity * 1.2,
      waveAnimationSpeed: 1.2 + intensity * 1.1,

      waterColor: 0x0f2026,
      fogColor: 0x4d6370,
      fogDensity: 0.00016 + intensity * 0.00018
    }
  }

  if (wave >= 0.5 || windSpeed >= 10) {
    return {
      label: 'Lagano valovito',
      description: hasRealWave
        ? `Stvarna visina valova je oko ${roundWave(wave)} m. More je lagano valovito.`
        : 'More se lagano kreće zbog umjerenog vjetra.',
      className: 'light',

      intensity,

      waveHeight: hasRealWave ? wave : 0.32,
      visibleWaveHeight: hasRealWave ? roundWave(wave) : 0.65,

      waveSpeed: 0.75 + intensity * 0.5,
      waveFrequency: 1.05,
      choppiness: 0.45 + intensity * 0.35,

      distortionScale: 2.5 + intensity * 4.5,
      waveSize: 5.3 - intensity * 1.5,
      waveAnimationSpeed: 0.55 + intensity * 0.6,

      waterColor: 0x00243d,
      fogColor: 0x7a9db8,
      fogDensity: 0.00005 + intensity * 0.00008
    }
  }

  return {
    label: 'Mirno more',
    description: hasRealWave
      ? `Stvarna visina valova je oko ${roundWave(wave)} m. More je gotovo mirno.`
      : 'Valovi su niski i more je gotovo mirno.',
    className: 'calm',

    intensity,

    waveHeight: hasRealWave ? wave : 0.16,
    visibleWaveHeight: hasRealWave ? roundWave(wave) : 0.25,

    waveSpeed: 0.45 + intensity * 0.25,
    waveFrequency: 0.75,
    choppiness: 0.2 + intensity * 0.25,

    distortionScale: 0.7 + intensity * 1.8,
    waveSize: 6.8 - intensity,
    waveAnimationSpeed: 0.22 + intensity * 0.25,

    waterColor: 0x001428,
    fogColor: 0x7a9db8,
    fogDensity: 0.00003
  }
}

export function applySeaStateToWater(water, seaState, scene = null) {
  water.userData.waveHeight = seaState.waveHeight
  water.userData.waveSpeed = seaState.waveSpeed
  water.userData.waveFrequency = seaState.waveFrequency
  water.userData.choppiness = seaState.choppiness
  water.userData.windDirection = seaState.windDirection || 315
  water.userData.waveAnimationSpeed = seaState.waveAnimationSpeed

  if (water.material.uniforms.distortionScale) {
    water.material.uniforms.distortionScale.value = seaState.distortionScale
  }

  if (water.material.uniforms.size) {
    water.material.uniforms.size.value = seaState.waveSize
  }

  if (water.material.uniforms.waterColor) {
    water.material.uniforms.waterColor.value.setHex(seaState.waterColor)
  }

  if (scene) {
    scene.fog = new THREE.FogExp2(
      seaState.fogColor,
      seaState.fogDensity
    )
  }
}