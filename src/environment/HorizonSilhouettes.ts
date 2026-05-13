import * as THREE from 'three'

export class HorizonSilhouettes {
  public readonly group: THREE.Group

  private readonly material: THREE.MeshBasicMaterial

  constructor() {
    this.group = new THREE.Group()
    this.group.name = 'Oceanis Distant Horizon Silhouettes'

    this.material = new THREE.MeshBasicMaterial({
      color: 0x07111c,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      fog: true
    })

    this.createIsland(-720, -1350, 1.1)
    this.createIsland(-290, -1450, 0.75)
    this.createIsland(250, -1380, 0.95)
    this.createIsland(760, -1500, 0.65)
  }

  public setPhaseMood(phase: 'night' | 'sunrise' | 'day' | 'sunset') {
    const settings = {
      night: { color: 0x020817, opacity: 0.42 },
      sunrise: { color: 0x332418, opacity: 0.26 },
      day: { color: 0x07111c, opacity: 0.2 },
      sunset: { color: 0x24130d, opacity: 0.32 }
    }

    const s = settings[phase]

    this.material.color.setHex(s.color)
    this.material.opacity = s.opacity
  }

  public setStormAmount(amount: number) {
    const storm = THREE.MathUtils.clamp(amount, 0, 1)

    this.material.opacity = THREE.MathUtils.lerp(
      this.material.opacity,
      0.46,
      storm
    )

    this.material.color.lerp(new THREE.Color(0x020817), storm * 0.1)
  }

  public dispose() {
    this.group.children.forEach(child => {
      const mesh = child as THREE.Mesh
      mesh.geometry.dispose()
    })

    this.material.dispose()
  }

  private createIsland(x: number, z: number, scale: number) {
    const shape = new THREE.Shape()

    shape.moveTo(-240, 0)
    shape.lineTo(-190, 16)
    shape.lineTo(-150, 28)
    shape.lineTo(-100, 22)
    shape.lineTo(-40, 48)
    shape.lineTo(20, 34)
    shape.lineTo(80, 62)
    shape.lineTo(140, 31)
    shape.lineTo(205, 18)
    shape.lineTo(250, 0)
    shape.lineTo(-240, 0)

    const geometry = new THREE.ShapeGeometry(shape)
    const mesh = new THREE.Mesh(geometry, this.material)

    mesh.position.set(x, 4, z)
    mesh.scale.set(scale, scale, scale)
    mesh.renderOrder = -2

    this.group.add(mesh)
  }
}