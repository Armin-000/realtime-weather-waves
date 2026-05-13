import * as THREE from 'three'

export type SkyPhase = 'night' | 'sunrise' | 'day' | 'sunset'

export type RealisticSkyMood = {
  phase?: SkyPhase
  cloudCover?: number
  precipitationIntensity?: number
  stormIntensity?: number
  isRaining?: boolean
}

type CloudLayerConfig = {
  name: string
  count: number
  minSize: number
  maxSize: number
  minHeight: number
  maxHeight: number
  spread: number
  opacity: number
  speed: number
  color: number
  textureStart: number
  textureEnd: number
}

export class RealisticSky {
  public readonly group: THREE.Group

  private readonly camera: THREE.Camera
  private readonly textureLoader = new THREE.TextureLoader()
  private readonly cloudTextures: THREE.Texture[] = []

  private readonly highClouds = new THREE.Group()
  private readonly midClouds = new THREE.Group()
  private readonly stormClouds = new THREE.Group()

  private readonly horizonHaze: THREE.Mesh
  private readonly sunGlow: THREE.Sprite

  private currentCloudCover = 0
  private targetCloudCover = 0

  private currentStorm = 0
  private targetStorm = 0

  private currentRain = 0
  private targetRain = 0

  private phase: SkyPhase = 'day'

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.camera = camera

    this.group = new THREE.Group()
    this.group.name = 'Oceanis Realistic Sky'

    this.loadCloudTextures()

    this.highClouds.name = 'High Cloud Layer'
    this.midClouds.name = 'Mid Cloud Layer'
    this.stormClouds.name = 'Storm Cloud Layer'

    this.createCloudLayer(this.highClouds, {
      name: 'High Cirrus Clouds',
      count: 34,
      minSize: 900,
      maxSize: 2100,
      minHeight: 900,
      maxHeight: 1450,
      spread: 10500,
      opacity: 0.16,
      speed: 0.18,
      color: 0xffffff,
      textureStart: 0,
      textureEnd: 4
    })

    this.createCloudLayer(this.midClouds, {
      name: 'Mid Cumulus Clouds',
      count: 46,
      minSize: 800,
      maxSize: 2400,
      minHeight: 520,
      maxHeight: 950,
      spread: 9500,
      opacity: 0.2,
      speed: 0.28,
      color: 0xe8f4ff,
      textureStart: 2,
      textureEnd: 8
    })

    this.createCloudLayer(this.stormClouds, {
      name: 'Storm Cloud Mass',
      count: 36,
      minSize: 1100,
      maxSize: 3000,
      minHeight: 430,
      maxHeight: 820,
      spread: 8800,
      opacity: 0,
      speed: 0.15,
      color: 0x6f7f8f,
      textureStart: 5,
      textureEnd: 10
    })

    this.horizonHaze = this.createHorizonHaze()
    this.sunGlow = this.createSunGlow()

    this.group.add(
      this.highClouds,
      this.midClouds,
      this.stormClouds,
      this.horizonHaze,
      this.sunGlow
    )

    scene.add(this.group)
  }

  public setMood(mood: RealisticSkyMood) {
    this.phase = mood.phase ?? this.phase

    const cloudRaw = mood.cloudCover ?? 0
    const cloudCover = cloudRaw > 1 ? cloudRaw / 100 : cloudRaw

    this.targetCloudCover = THREE.MathUtils.clamp(cloudCover, 0, 1)
    this.targetStorm = THREE.MathUtils.clamp(mood.stormIntensity ?? 0, 0, 1)
    this.targetRain = THREE.MathUtils.clamp(mood.precipitationIntensity ?? 0, 0, 1)

    if (mood.isRaining) {
      this.targetRain = Math.max(this.targetRain, 0.35)
    }

    this.applyPhaseColors()
  }

  public update(delta: number, windSpeed = 0) {
    this.group.position.copy(this.camera.position)

    this.currentCloudCover = THREE.MathUtils.damp(
      this.currentCloudCover,
      this.targetCloudCover,
      1.4,
      delta
    )

    this.currentStorm = THREE.MathUtils.damp(
      this.currentStorm,
      this.targetStorm,
      1.2,
      delta
    )

    this.currentRain = THREE.MathUtils.damp(
      this.currentRain,
      this.targetRain,
      1.7,
      delta
    )

    const windFactor = THREE.MathUtils.clamp(windSpeed / 60, 0.25, 2.4)

    this.animateCloudGroup(this.highClouds, delta, windFactor, 0.16)
    this.animateCloudGroup(this.midClouds, delta, windFactor, 0.28)
    this.animateCloudGroup(this.stormClouds, delta, windFactor, 0.12)

    this.updateCloudOpacities()
    this.updateSunGlow()
    this.updateHorizonHaze()
  }

  public dispose() {
    this.disposeGroup(this.highClouds)
    this.disposeGroup(this.midClouds)
    this.disposeGroup(this.stormClouds)

    this.disposeMesh(this.horizonHaze)

    if (this.sunGlow.material instanceof THREE.SpriteMaterial) {
      this.sunGlow.material.map?.dispose()
      this.sunGlow.material.dispose()
    }

    this.cloudTextures.forEach(texture => texture.dispose())
  }

  private loadCloudTextures() {
    for (let i = 1; i <= 10; i++) {
      const index = String(i).padStart(2, '0')
      const texture = this.textureLoader.load(`/clouds/FX_CloudAlpha${index}.png`)

      texture.colorSpace = THREE.SRGBColorSpace
      texture.wrapS = THREE.ClampToEdgeWrapping
      texture.wrapT = THREE.ClampToEdgeWrapping
      texture.needsUpdate = true

      this.cloudTextures.push(texture)
    }
  }

  private createCloudLayer(group: THREE.Group, config: CloudLayerConfig) {
    for (let i = 0; i < config.count; i++) {
      const textureIndex = THREE.MathUtils.clamp(
        Math.floor(
          THREE.MathUtils.randInt(config.textureStart, config.textureEnd - 1)
        ),
        0,
        this.cloudTextures.length - 1
      )

      const texture = this.cloudTextures[textureIndex]

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        depthWrite: false,
        depthTest: false,
        blending: THREE.NormalBlending,
        side: THREE.DoubleSide,
        fog: false
      })

      const width = THREE.MathUtils.randFloat(config.minSize, config.maxSize)
      const height = width * THREE.MathUtils.randFloat(0.32, 0.58)

      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        material
      )

      mesh.name = config.name

      mesh.position.set(
        THREE.MathUtils.randFloatSpread(config.spread),
        THREE.MathUtils.randFloat(config.minHeight, config.maxHeight),
        THREE.MathUtils.randFloatSpread(config.spread)
      )

      mesh.rotation.x = -Math.PI / 2
      mesh.rotation.z = Math.random() * Math.PI * 2

      mesh.renderOrder = -30
      mesh.frustumCulled = false

      mesh.userData = {
        baseOpacity: config.opacity,
        speed: config.speed * THREE.MathUtils.randFloat(0.45, 1.35),
        drift: THREE.MathUtils.randFloat(0.4, 1.2),
        startX: mesh.position.x,
        startZ: mesh.position.z,
        verticalFloat: Math.random() * Math.PI * 2
      }

      group.add(mesh)
    }
  }

  private animateCloudGroup(
    group: THREE.Group,
    delta: number,
    windFactor: number,
    baseSpeed: number
  ) {
    const spread = 6200

    group.children.forEach(child => {
      const mesh = child as THREE.Mesh
      const data = mesh.userData

      mesh.position.x += data.speed * windFactor * delta * 18
      mesh.position.z += baseSpeed * windFactor * delta * 4
      mesh.position.y += Math.sin(performance.now() * 0.00008 + data.verticalFloat) * 0.015

      if (mesh.position.x > spread) mesh.position.x = -spread
      if (mesh.position.z > spread) mesh.position.z = -spread
    })
  }

  private updateCloudOpacities() {
    const cloud = this.currentCloudCover
    const storm = this.currentStorm
    const rain = this.currentRain

    this.highClouds.children.forEach(child => {
      const mesh = child as THREE.Mesh
      const mat = mesh.material as THREE.MeshBasicMaterial

      mat.opacity = THREE.MathUtils.clamp(
        0.05 + cloud * 0.18 - storm * 0.04,
        0.03,
        0.28
      )
    })

    this.midClouds.children.forEach(child => {
      const mesh = child as THREE.Mesh
      const mat = mesh.material as THREE.MeshBasicMaterial

      mat.opacity = THREE.MathUtils.clamp(
        0.08 + cloud * 0.26 + rain * 0.05,
        0.04,
        0.38
      )
    })

    this.stormClouds.children.forEach(child => {
      const mesh = child as THREE.Mesh
      const mat = mesh.material as THREE.MeshBasicMaterial

      mat.opacity = THREE.MathUtils.clamp(
        storm * 0.34 + rain * 0.18 + cloud * 0.08,
        0,
        0.48
      )
    })
  }

  private updateSunGlow() {
    const mat = this.sunGlow.material as THREE.SpriteMaterial

    const isNight = this.phase === 'night'
    const stormBlock = THREE.MathUtils.clamp(
      this.currentStorm * 0.72 +
        this.currentRain * 0.42 +
        this.currentCloudCover * 0.3,
      0,
      0.88
    )

    const baseOpacity =
      this.phase === 'sunrise' || this.phase === 'sunset'
        ? 0.68
        : 0.38

    mat.opacity = isNight ? 0 : baseOpacity * (1 - stormBlock)

    const scale =
      this.phase === 'sunrise' || this.phase === 'sunset'
        ? 1250
        : 850

    this.sunGlow.scale.setScalar(scale)

    if (this.phase === 'sunrise') {
      mat.color.setHex(0xffc58a)
    } else if (this.phase === 'sunset') {
      mat.color.setHex(0xff9b5e)
    } else {
      mat.color.setHex(0xdff6ff)
    }

    this.sunGlow.position.set(0, 1250, -2400)
  }

  private updateHorizonHaze() {
    const mat = this.horizonHaze.material as THREE.MeshBasicMaterial

    const haze =
    0.08 +
    this.currentCloudCover * 0.07 +
    this.currentRain * 0.08 +
    this.currentStorm * 0.1

    mat.opacity = THREE.MathUtils.clamp(haze, 0.05, 0.22)

    if (this.phase === 'sunrise') {
      mat.color.setHex(0xffc08a)
    } else if (this.phase === 'sunset') {
      mat.color.setHex(0xff9966)
    } else if (this.phase === 'night') {
      mat.color.setHex(0x0b1526)
    } else {
      mat.color.setHex(0x93c9df)
    }
  }

  private applyPhaseColors() {
    const highColor = new THREE.Color()
    const midColor = new THREE.Color()
    const stormColor = new THREE.Color()

    if (this.phase === 'sunrise') {
      highColor.setHex(0xffe1bd)
      midColor.setHex(0xffc69b)
      stormColor.setHex(0x7c6b67)
    } else if (this.phase === 'sunset') {
      highColor.setHex(0xffc58a)
      midColor.setHex(0xff9c6b)
      stormColor.setHex(0x5f4d4a)
    } else if (this.phase === 'night') {
      highColor.setHex(0x8ba7c9)
      midColor.setHex(0x536a88)
      stormColor.setHex(0x202a38)
    } else {
      highColor.setHex(0xffffff)
      midColor.setHex(0xe8f4ff)
      stormColor.setHex(0x6f7f8f)
    }

    this.applyColorToGroup(this.highClouds, highColor)
    this.applyColorToGroup(this.midClouds, midColor)
    this.applyColorToGroup(this.stormClouds, stormColor)
  }

  private applyColorToGroup(group: THREE.Group, color: THREE.Color) {
    group.children.forEach(child => {
      const mesh = child as THREE.Mesh
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.color.copy(color)
    })
  }

  private createHorizonHaze() {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 512

    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Horizon haze canvas could not be created.')
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)

    gradient.addColorStop(0, 'rgba(255,255,255,0)')
    gradient.addColorStop(0.42, 'rgba(255,255,255,0.03)')
    gradient.addColorStop(0.62, 'rgba(255,255,255,0.35)')
    gradient.addColorStop(0.82, 'rgba(255,255,255,0.15)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const texture = new THREE.CanvasTexture(canvas)

    const geometry = new THREE.PlaneGeometry(9000, 900)

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      color: 0x93c9df,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(0, 180, -3600)
    mesh.frustumCulled = false
    mesh.renderOrder = -20

    return mesh
  }

  private createSunGlow() {
    const texture = this.createRadialGlowTexture()

    const material = new THREE.SpriteMaterial({
      map: texture,
      color: 0xdff6ff,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    })

    const sprite = new THREE.Sprite(material)
    sprite.name = 'Cinematic Sun Glow'
    sprite.position.set(0, 1250, -2400)
    sprite.scale.setScalar(850)
    sprite.renderOrder = -10

    return sprite
  }

  private createRadialGlowTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512

    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Sun glow canvas could not be created.')
    }

    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)

    gradient.addColorStop(0, 'rgba(255,255,255,0.95)')
    gradient.addColorStop(0.08, 'rgba(255,240,210,0.65)')
    gradient.addColorStop(0.28, 'rgba(255,210,150,0.22)')
    gradient.addColorStop(0.62, 'rgba(255,180,100,0.07)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true

    return texture
  }

  private disposeGroup(group: THREE.Group) {
    group.children.forEach(child => {
      const mesh = child as THREE.Mesh
      this.disposeMesh(mesh)
    })
  }

  private disposeMesh(mesh: THREE.Mesh) {
    mesh.geometry.dispose()

    if (mesh.material instanceof THREE.MeshBasicMaterial) {
      mesh.material.map?.dispose()
      mesh.material.dispose()
    }
  }
}