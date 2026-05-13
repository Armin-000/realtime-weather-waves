import * as THREE from 'three'

export type StormAtmosphereState = {
  isRaining?: boolean
  precipitationIntensity?: number
  stormIntensity?: number
  weatherCode?: number | null
  isDay?: boolean
}

export class StormAtmosphere {
  private readonly scene: THREE.Scene
  private readonly renderer: THREE.WebGLRenderer

  private baseFogColor = new THREE.Color(0x081826)
  private stormFogColor = new THREE.Color(0x050b12)

  private baseFogDensity = 0.0016
  private stormFogDensity = 0.0042

  private baseExposure = 0.88
  private stormExposure = 0.58

  private currentStormAmount = 0
  private targetStormAmount = 0

  private currentFogColor = new THREE.Color()
  private currentFogDensity = this.baseFogDensity
  private currentExposure = this.baseExposure

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene
    this.renderer = renderer

    if (scene.fog instanceof THREE.FogExp2) {
      this.baseFogColor.copy(scene.fog.color)
      this.baseFogDensity = scene.fog.density
    }

    this.baseExposure = renderer.toneMappingExposure
    this.currentFogColor.copy(this.baseFogColor)
  }

  public setBaseFromCurrentScene() {
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.baseFogColor.copy(this.scene.fog.color)
      this.baseFogDensity = this.scene.fog.density
    }

    this.baseExposure = this.renderer.toneMappingExposure
  }

  public setStormState(state: StormAtmosphereState) {
    const rain = THREE.MathUtils.clamp(state.precipitationIntensity ?? 0, 0, 1)
    const storm = THREE.MathUtils.clamp(state.stormIntensity ?? 0, 0, 1)

    const thunderCodeBoost = this.isThunderstormCode(state.weatherCode) ? 0.35 : 0
    const rainBoost = state.isRaining ? 0.18 : 0

    this.targetStormAmount = THREE.MathUtils.clamp(
      Math.max(rain, storm) + thunderCodeBoost + rainBoost,
      0,
      1
    )
  }

  public update(delta: number) {
    this.currentStormAmount = THREE.MathUtils.damp(
      this.currentStormAmount,
      this.targetStormAmount,
      1.8,
      delta
    )

    const amount = this.currentStormAmount

    this.currentFogColor.copy(this.baseFogColor).lerp(this.stormFogColor, amount)

    this.currentFogDensity = THREE.MathUtils.lerp(
      this.baseFogDensity,
      this.stormFogDensity,
      amount
    )

    this.currentExposure = THREE.MathUtils.lerp(
      this.baseExposure,
      this.stormExposure,
      amount
    )

    if (!(this.scene.fog instanceof THREE.FogExp2)) {
      this.scene.fog = new THREE.FogExp2(this.currentFogColor, this.currentFogDensity)
    } else {
      this.scene.fog.color.copy(this.currentFogColor)
      this.scene.fog.density = this.currentFogDensity
    }

    this.renderer.toneMappingExposure = this.currentExposure
  }

  public forceClear() {
    this.targetStormAmount = 0
  }

  public getStormAmount() {
    return this.currentStormAmount
  }

  private isThunderstormCode(code?: number | null) {
    if (code == null) return false

    return code === 95 || code === 96 || code === 99
  }
}