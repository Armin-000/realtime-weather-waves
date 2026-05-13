import * as THREE from 'three'

export type StormAtmosphereState = {
  isRaining?: boolean
  precipitationIntensity?: number
  stormIntensity?: number
  cloudCover?: number
  weatherCode?: number | null
  isDay?: boolean
}

export class StormAtmosphere {
  private readonly scene: THREE.Scene
  private readonly renderer: THREE.WebGLRenderer

  private readonly baseFogColor = new THREE.Color(0x081826)
  private readonly rainFogColor = new THREE.Color(0x203848)
  private readonly stormFogColor = new THREE.Color(0x182833)
  private readonly nightStormFogColor = new THREE.Color(0x07111c)

  private baseFogDensity = 0.00045
  private rainFogDensity = 0.00075
  private stormFogDensity = 0.00115

  private baseExposure = 0.88
  private rainExposure = 0.78
  private stormExposure = 0.68
  private nightStormExposure = 0.5

  private currentAtmosphereAmount = 0
  private targetAtmosphereAmount = 0

  private currentRainAmount = 0
  private targetRainAmount = 0

  private currentCloudAmount = 0
  private targetCloudAmount = 0

  private isDay = true

  private currentFogColor = new THREE.Color()
  private currentFogDensity = this.baseFogDensity
  private currentExposure = this.baseExposure

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene
    this.renderer = renderer

    if (scene.fog instanceof THREE.FogExp2) {
      this.baseFogColor.copy(scene.fog.color)
      this.baseFogDensity = sceneSafeDensity(scene.fog.density)
    }

    this.baseExposure = renderer.toneMappingExposure
    this.currentFogColor.copy(this.baseFogColor)
    this.currentFogDensity = this.baseFogDensity
    this.currentExposure = this.baseExposure
  }

  public setBaseFromCurrentScene() {
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.baseFogColor.copy(this.scene.fog.color)
      this.baseFogDensity = sceneSafeDensity(this.scene.fog.density)
    }

    this.baseExposure = exposureSafeValue(this.renderer.toneMappingExposure)
  }

  public setStormState(state: StormAtmosphereState) {
    const rain = THREE.MathUtils.clamp(
      state.precipitationIntensity ?? 0,
      0,
      1
    )

    const storm = THREE.MathUtils.clamp(
      state.stormIntensity ?? 0,
      0,
      1
    )

    const cloudCoverRaw = state.cloudCover ?? 0
    const cloudCover =
      cloudCoverRaw > 1 ? cloudCoverRaw / 100 : cloudCoverRaw

    const clouds = THREE.MathUtils.clamp(cloudCover, 0, 1)

    const thunderCodeBoost = this.isThunderstormCode(state.weatherCode)
      ? 0.38
      : 0

    const rainBoost = state.isRaining ? 0.2 : 0

    this.isDay = state.isDay ?? true

    this.targetRainAmount = rain
    this.targetCloudAmount = clouds

    this.targetAtmosphereAmount = THREE.MathUtils.clamp(
      Math.max(
        storm,
        rain * 0.85,
        clouds * 0.45
      ) +
        thunderCodeBoost +
        rainBoost,
      0,
      1
    )
  }

  public update(delta: number) {
    this.currentAtmosphereAmount = THREE.MathUtils.damp(
      this.currentAtmosphereAmount,
      this.targetAtmosphereAmount,
      1.65,
      delta
    )

    this.currentRainAmount = THREE.MathUtils.damp(
      this.currentRainAmount,
      this.targetRainAmount,
      2.2,
      delta
    )

    this.currentCloudAmount = THREE.MathUtils.damp(
      this.currentCloudAmount,
      this.targetCloudAmount,
      1.35,
      delta
    )

    const stormAmount = this.currentAtmosphereAmount
    const rainAmount = this.currentRainAmount
    const cloudAmount = this.currentCloudAmount

    const finalStormColor = this.isDay
      ? this.stormFogColor
      : this.nightStormFogColor

    this.currentFogColor.copy(this.baseFogColor)

    this.currentFogColor.lerp(this.rainFogColor, rainAmount * 0.55)
    this.currentFogColor.lerp(finalStormColor, stormAmount * 0.9)

    this.currentFogDensity =
      this.baseFogDensity +
      rainAmount * (this.rainFogDensity - this.baseFogDensity) +
      stormAmount * (this.stormFogDensity - this.baseFogDensity) +
      cloudAmount * 0.0009

    this.currentFogDensity = sceneSafeDensity(this.currentFogDensity)

    const cloudyExposure = THREE.MathUtils.lerp(
      this.baseExposure,
      this.baseExposure * 0.78,
      cloudAmount
    )

    const rainyExposure = THREE.MathUtils.lerp(
      cloudyExposure,
      this.rainExposure,
      rainAmount
    )

    const targetStormExposure = this.isDay
      ? this.stormExposure
      : this.nightStormExposure

    this.currentExposure = THREE.MathUtils.lerp(
      rainyExposure,
      targetStormExposure,
      stormAmount
    )

    this.currentExposure = exposureSafeValue(this.currentExposure)

    if (!(this.scene.fog instanceof THREE.FogExp2)) {
      this.scene.fog = new THREE.FogExp2(
        this.currentFogColor,
        this.currentFogDensity
      )
    } else {
      this.scene.fog.color.copy(this.currentFogColor)
      this.scene.fog.density = this.currentFogDensity
    }

    this.renderer.toneMappingExposure = this.currentExposure
  }

  public forceClear() {
    this.targetAtmosphereAmount = 0
    this.targetRainAmount = 0
    this.targetCloudAmount = 0
  }

  public getStormAmount() {
    return this.currentAtmosphereAmount
  }

  public getRainAmount() {
    return this.currentRainAmount
  }

  public getCloudAmount() {
    return this.currentCloudAmount
  }

  private isThunderstormCode(code?: number | null) {
    if (code == null) return false

    return code === 95 || code === 96 || code === 99
  }
}

function sceneSafeDensity(value: number) {
  if (!Number.isFinite(value)) return 0.0014

  return THREE.MathUtils.clamp(value, 0.00015, 0.0022)
}

function exposureSafeValue(value: number) {
  if (!Number.isFinite(value)) return 0.7

  return THREE.MathUtils.clamp(value, 0.45, 1.25)
}