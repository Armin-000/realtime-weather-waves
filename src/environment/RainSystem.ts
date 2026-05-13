import * as THREE from 'three'

export class RainSystem {
  public readonly group: THREE.Group

  private readonly rain: THREE.Points
  private readonly splash: THREE.Points

  private readonly rainGeometry: THREE.BufferGeometry
  private readonly splashGeometry: THREE.BufferGeometry

  private readonly rainMaterial: THREE.PointsMaterial
  private readonly splashMaterial: THREE.PointsMaterial

  private readonly rainPositions: Float32Array
  private readonly rainVelocities: Float32Array

  private readonly splashPositions: Float32Array
  private readonly splashLife: Float32Array

  private readonly rainCount: number
  private readonly splashCount: number

  private intensity = 0
  private targetIntensity = 0

  private readonly area = 520
  private readonly height = 320

  constructor(rainCount = 5200, splashCount = 700) {
    this.group = new THREE.Group()
    this.group.name = 'Oceanis Rain System'

    this.rainCount = rainCount
    this.splashCount = splashCount

    this.rainGeometry = new THREE.BufferGeometry()
    this.rainPositions = new Float32Array(this.rainCount * 3)
    this.rainVelocities = new Float32Array(this.rainCount)

    for (let i = 0; i < this.rainCount; i++) {
      this.resetRainDrop(i, true)
    }

    this.rainGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.rainPositions, 3)
    )

    this.rainMaterial = new THREE.PointsMaterial({
      color: 0xbfdfff,
      size: 0.85,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })

    this.rain = new THREE.Points(this.rainGeometry, this.rainMaterial)
    this.rain.frustumCulled = false
    this.rain.name = 'Rain Drops'

    this.splashGeometry = new THREE.BufferGeometry()
    this.splashPositions = new Float32Array(this.splashCount * 3)
    this.splashLife = new Float32Array(this.splashCount)

    for (let i = 0; i < this.splashCount; i++) {
      this.resetSplash(i)
    }

    this.splashGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.splashPositions, 3)
    )

    this.splashMaterial = new THREE.PointsMaterial({
      color: 0xd8f3ff,
      size: 1.25,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })

    this.splash = new THREE.Points(this.splashGeometry, this.splashMaterial)
    this.splash.frustumCulled = false
    this.splash.name = 'Rain Splashes'

    this.group.add(this.rain, this.splash)
    this.group.visible = false
  }

  public setIntensity(value: number) {
    this.targetIntensity = THREE.MathUtils.clamp(value, 0, 1)
  }

  public update(delta: number, windDirection = 0, windSpeed = 0) {
    this.intensity = THREE.MathUtils.damp(
      this.intensity,
      this.targetIntensity,
      3.2,
      delta
    )

    this.group.visible = this.intensity > 0.015

    if (!this.group.visible) {
      this.rainMaterial.opacity = 0
      this.splashMaterial.opacity = 0
      return
    }

    this.rainMaterial.opacity = this.intensity * 0.52
    this.splashMaterial.opacity = this.intensity * 0.36

    const windRad = THREE.MathUtils.degToRad(windDirection + 180)
    const windForce = THREE.MathUtils.clamp(windSpeed / 85, 0, 1)

    const pushX = Math.sin(windRad) * windForce * 34
    const pushZ = Math.cos(windRad) * windForce * 34

    for (let i = 0; i < this.rainCount; i++) {
      const i3 = i * 3

      this.rainPositions[i3] += pushX * delta
      this.rainPositions[i3 + 1] -= this.rainVelocities[i] * delta * (0.75 + this.intensity)
      this.rainPositions[i3 + 2] += pushZ * delta

      if (
        this.rainPositions[i3 + 1] < 0 ||
        Math.abs(this.rainPositions[i3]) > this.area * 0.65 ||
        Math.abs(this.rainPositions[i3 + 2]) > this.area * 0.65
      ) {
        this.resetRainDrop(i)
      }
    }

    for (let i = 0; i < this.splashCount; i++) {
      const i3 = i * 3

      this.splashLife[i] -= delta * (0.7 + this.intensity * 2.2)

      if (this.splashLife[i] <= 0) {
        if (Math.random() < this.intensity) {
          this.spawnSplash(i)
        } else {
          this.resetSplash(i)
        }
      }

      this.splashPositions[i3 + 1] += delta * 2.5
    }

    this.rainGeometry.attributes.position.needsUpdate = true
    this.splashGeometry.attributes.position.needsUpdate = true
  }

  public dispose() {
    this.rainGeometry.dispose()
    this.splashGeometry.dispose()
    this.rainMaterial.dispose()
    this.splashMaterial.dispose()
  }

  private resetRainDrop(index: number, initial = false) {
    const i3 = index * 3

    this.rainPositions[i3] = (Math.random() - 0.5) * this.area
    this.rainPositions[i3 + 1] = initial
      ? Math.random() * this.height
      : this.height * (0.75 + Math.random() * 0.35)
    this.rainPositions[i3 + 2] = (Math.random() - 0.5) * this.area

    this.rainVelocities[index] = 65 + Math.random() * 95
  }

  private resetSplash(index: number) {
    const i3 = index * 3

    this.splashPositions[i3] = 9999
    this.splashPositions[i3 + 1] = 9999
    this.splashPositions[i3 + 2] = 9999

    this.splashLife[index] = 0
  }

  private spawnSplash(index: number) {
    const i3 = index * 3

    this.splashPositions[i3] = (Math.random() - 0.5) * this.area
    this.splashPositions[i3 + 1] = 1.2 + Math.random() * 1.5
    this.splashPositions[i3 + 2] = (Math.random() - 0.5) * this.area

    this.splashLife[index] = 0.18 + Math.random() * 0.25
  }
}