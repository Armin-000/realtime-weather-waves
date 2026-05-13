import * as THREE from 'three'

type CloudLayerOptions = {
  radius?: number
  opacity?: number
  speed?: number
  color?: number
  height?: number
}

export class CloudLayer {
  public readonly group: THREE.Group

  private readonly layers: THREE.Mesh[]
  private readonly speeds: number[]

  constructor() {
    this.group = new THREE.Group()
    this.group.name = 'Oceanis Cloud Layers'

    this.layers = []
    this.speeds = []

    this.createLayer({
      radius: 7200,
      opacity: 0.18,
      speed: 0.0015,
      color: 0xffffff,
      height: 0
    })

    this.createLayer({
      radius: 6900,
      opacity: 0.1,
      speed: -0.0009,
      color: 0xd9ecff,
      height: -120
    })

    this.group.visible = true
  }

  public update(delta: number, windSpeed = 0) {
    const windFactor = THREE.MathUtils.clamp(windSpeed / 60, 0.25, 2.2)

    this.layers.forEach((layer, index) => {
      layer.rotation.y += this.speeds[index] * delta * windFactor
    })
  }

  public setPhaseMood(phase: 'night' | 'sunrise' | 'day' | 'sunset') {
    const settings = {
      night: {
        opacity: [0.09, 0.05],
        color: [0x9fc7ff, 0x6f8fbf]
      },
      sunrise: {
        opacity: [0.2, 0.13],
        color: [0xffd1a3, 0xffa96b]
      },
      day: {
        opacity: [0.16, 0.09],
        color: [0xffffff, 0xd9ecff]
      },
      sunset: {
        opacity: [0.24, 0.16],
        color: [0xffb36b, 0xff7a45]
      }
    }

    const s = settings[phase]

    this.layers.forEach((layer, index) => {
      const mat = layer.material as THREE.MeshBasicMaterial
      mat.opacity = s.opacity[index] ?? s.opacity[0]
      mat.color.setHex(s.color[index] ?? s.color[0])
    })
  }

  public setStormAmount(amount: number) {
    const storm = THREE.MathUtils.clamp(amount, 0, 1)

    this.layers.forEach((layer, index) => {
      const mat = layer.material as THREE.MeshBasicMaterial

      const baseOpacity = index === 0 ? 0.16 : 0.09
      mat.opacity = THREE.MathUtils.lerp(baseOpacity, 0.34, storm)

      mat.color.lerp(new THREE.Color(0x4e5f70), storm * 0.08)
    })
  }

  public dispose() {
    this.layers.forEach(layer => {
      layer.geometry.dispose()
      ;(layer.material as THREE.Material).dispose()
    })
  }

  private createLayer(options: CloudLayerOptions) {
    const radius = options.radius ?? 7000

    const texture = this.createCloudTexture()

    const geometry = new THREE.SphereGeometry(radius, 96, 48, 0, Math.PI * 2, 0, Math.PI * 0.52)

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      color: options.color ?? 0xffffff,
      transparent: true,
      opacity: options.opacity ?? 0.15,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending
    })

    const mesh = new THREE.Mesh(geometry, material)

    mesh.position.y = options.height ?? 0
    mesh.rotation.x = 0
    mesh.frustumCulled = false
    mesh.renderOrder = -10

    this.group.add(mesh)
    this.layers.push(mesh)
    this.speeds.push(options.speed ?? 0.001)
  }

  private createCloudTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512

    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Cloud texture canvas could not be created.')
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)

    gradient.addColorStop(0, 'rgba(255,255,255,0)')
    gradient.addColorStop(0.25, 'rgba(255,255,255,0.18)')
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.42)')
    gradient.addColorStop(0.78, 'rgba(255,255,255,0.14)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < 160; i++) {
      const x = Math.random() * canvas.width
      const y = canvas.height * (0.18 + Math.random() * 0.58)
      const rx = 60 + Math.random() * 180
      const ry = 8 + Math.random() * 34

      const cloud = ctx.createRadialGradient(x, y, 0, x, y, rx)

      cloud.addColorStop(0, `rgba(255,255,255,${0.12 + Math.random() * 0.28})`)
      cloud.addColorStop(0.45, `rgba(255,255,255,${0.06 + Math.random() * 0.16})`)
      cloud.addColorStop(1, 'rgba(255,255,255,0)')

      ctx.fillStyle = cloud
      ctx.beginPath()
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.repeat.set(1, 1)
    texture.needsUpdate = true

    return texture
  }
}