export function mapWindToSeaState(windSpeed) {
  if (windSpeed < 10) {
    return {
      label: 'Mirno more',
      description: 'Valovi su niski i more je gotovo mirno.',
      className: 'calm',
      intensity: 0.2,
      waveHeight: 0.16,
      visibleWaveHeight: 0.25,
      waveSpeed: 0.55,
      waveFrequency: 0.75,
      choppiness: 0.25
    }
  }

  if (windSpeed < 25) {
    return {
      label: 'Lagano valovito',
      description: 'More se lagano kreće zbog umjerenog vjetra.',
      className: 'light',
      intensity: 0.45,
      waveHeight: 0.32,
      visibleWaveHeight: 0.65,
      waveSpeed: 0.85,
      waveFrequency: 1.05,
      choppiness: 0.5
    }
  }

  if (windSpeed < 45) {
    return {
      label: 'Jako valovito',
      description: 'Valovi su viši i more jasno reagira na vjetar.',
      className: 'strong',
      intensity: 0.75,
      waveHeight: 0.62,
      visibleWaveHeight: 1.35,
      waveSpeed: 1.25,
      waveFrequency: 1.35,
      choppiness: 0.85
    }
  }

  return {
    label: 'Olujno more',
    description: 'More je nemirno, valovi su agresivni i brzi.',
    className: 'storm',
    intensity: 1,
    waveHeight: 1.05,
    visibleWaveHeight: 2.4,
    waveSpeed: 1.8,
    waveFrequency: 1.75,
    choppiness: 1.25
  }
}

export function applySeaStateToWater(water, seaState) {
  water.userData.waveHeight = seaState.waveHeight
  water.userData.waveSpeed = seaState.waveSpeed
  water.userData.waveFrequency = seaState.waveFrequency
  water.userData.choppiness = seaState.choppiness
  water.userData.windDirection = seaState.windDirection || 315
}