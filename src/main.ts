import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import { getCurrentWeather } from './weather/weatherService'
import { mapWeatherToSeaState, applySeaStateToWater } from './water/weatherWaves'
import {
  buildWeatherPanel,
  buildLoadingPanel,
  buildErrorPanel,
  setPanel,
  bindSearch,
  PHASE_LABELS
} from './panel/panelBuilder'
import './style.css'

type WeatherData = Awaited<ReturnType<typeof getCurrentWeather>>
type SeaState = ReturnType<typeof mapWeatherToSeaState> & {
  windDirection?: number
}

type DayPhase = 'night' | 'sunrise' | 'day' | 'sunset'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App container was not found.')
}

// ─── Renderer / Scene / Camera ───────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.5

app.appendChild(renderer.domElement)

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  20000
)

camera.position.set(0, 61, 220)

const controls = new OrbitControls(camera, renderer.domElement)

Object.assign(controls, {
  enableDamping: true,
  minDistance: 8,
  maxDistance: 320,
  maxPolarAngle: Math.PI * 0.48
})

controls.target.set(0, 0, 0)
controls.update()

// ─── Sky & Water ─────────────────────────────────────────────────────────────
const sky = new Sky()
sky.scale.setScalar(10000)
scene.add(sky)

const su = sky.material.uniforms
su.turbidity.value = 6
su.rayleigh.value = 1.8
su.mieCoefficient.value = 0.004
su.mieDirectionalG.value = 0.78

const waterNormals = new THREE.TextureLoader().load(
  'https://threejs.org/examples/textures/waternormals.jpg',
  texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  }
)

const waterGeometry = new THREE.PlaneGeometry(10000, 10000, 220, 220)

const water = new Water(waterGeometry, {
  textureWidth: 1024,
  textureHeight: 1024,
  waterNormals,
  sunDirection: new THREE.Vector3(),
  sunColor: 0xd8ecff,
  waterColor: 0x00324d,
  distortionScale: 3.7,
  fog: true
})

water.rotation.x = -Math.PI / 2

water.userData = {
  waveSpeed: 0.65,
  choppiness: 0.55,
  windDirection: 315,
  stormIntensity: 0
}

scene.add(water)

const waterPosition = water.geometry.attributes.position as THREE.BufferAttribute
const baseWaterPositions = waterPosition.array.slice()

function updatePhysicalWaves(time: number) {
  const sea = currentSeaState
  if (!sea) return

  const pos = water.geometry.attributes.position as THREE.BufferAttribute
  const arr = pos.array

  const intensity = sea.intensity ?? 0.3
  const realWaveHeight = sea.waveHeight ?? 0.3
  const storm = sea.stormIntensity ?? 0

  const amplitude =
    0.7 +
    realWaveHeight * 1.8 +
    intensity * 2.2 +
    storm * 3.2

  const frequency =
    0.0025 +
    intensity * 0.0035 +
    storm * 0.002

  const speed = sea.waveAnimationSpeed ?? 1

  for (let i = 0; i < arr.length; i += 3) {
    const x = Number(baseWaterPositions[i])
    const y = Number(baseWaterPositions[i + 1])

    const wave1 = Math.sin(x * frequency + time * speed * 1.5)
    const wave2 = Math.sin(y * frequency * 1.4 + time * speed * 1.2)
    const wave3 = Math.sin((x + y) * frequency * 0.8 + time * speed * 1.8)
    const wave4 = Math.sin((x - y) * frequency * 1.7 + time * speed * 0.9)

    arr[i + 2] =
      (wave1 * 0.42 +
        wave2 * 0.32 +
        wave3 * 0.18 +
        wave4 * 0.08) *
      amplitude
  }

  pos.needsUpdate = true
  water.geometry.computeVertexNormals()
}

// ─── Lighting ────────────────────────────────────────────────────────────────
const sun = new THREE.Vector3()
const pmrem = new THREE.PMREMGenerator(renderer)
let envTarget: THREE.WebGLRenderTarget | null = null

const dirLight = new THREE.DirectionalLight(0xffffff, 2)
const moonLight = new THREE.DirectionalLight(0xc7ddff, 0)
const ambientNight = new THREE.AmbientLight(0x7da7d9, 0)
const moonFill = new THREE.HemisphereLight(0x9fc7ff, 0x020817, 0)

moonLight.position.set(-40, 70, -80)
scene.add(dirLight, moonLight, ambientNight, moonFill)

function updateSun(elevation = 18, azimuth = 180) {
  sun.setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(90 - elevation),
    THREE.MathUtils.degToRad(azimuth)
  )

  su.sunPosition.value.copy(sun)
  water.material.uniforms.sunDirection.value.copy(sun).normalize()
  dirLight.position.copy(sun).multiplyScalar(100)

  envTarget?.dispose()
  envTarget = pmrem.fromScene(sky)
  scene.environment = envTarget.texture
}

updateSun()

// ─── Night sky ───────────────────────────────────────────────────────────────
const nightGroup = new THREE.Group()
scene.add(nightGroup)

const STAR_COUNT = 2500
const starPos = new Float32Array(STAR_COUNT * 3)

for (let i = 0; i < STAR_COUNT; i++) {
  starPos[i * 3] = (Math.random() - 0.5) * 2200
  starPos[i * 3 + 1] = 80 + Math.random() * 900
  starPos[i * 3 + 2] = (Math.random() - 0.5) * 2200
}

const starGeo = new THREE.BufferGeometry()
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))

const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 1.25,
  transparent: true,
  opacity: 0
})

const stars = new THREE.Points(starGeo, starMat)
nightGroup.add(stars)
nightGroup.visible = false

// ─── Wind ribbons ─────────────────────────────────────────────────────────────
const windGroup = new THREE.Group()
scene.add(windGroup)

function createWindTexture() {
  const canvas = Object.assign(document.createElement('canvas'), {
    width: 512,
    height: 64
  })

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 2D context could not be created.')
  }

  const gradient = ctx.createLinearGradient(0, 0, 512, 0)

  const gradientStops: [number, string][] = [
    [0, 'rgba(255,255,255,0)'],
    [0.18, 'rgba(255,255,255,0.18)'],
    [0.5, 'rgba(255,255,255,0.75)'],
    [0.82, 'rgba(255,255,255,0.18)'],
    [1, 'rgba(255,255,255,0)']
  ]

  gradientStops.forEach(([stop, color]) => {
    gradient.addColorStop(stop, color)
  })

  ctx.fillStyle = gradient

  for (let i = 0; i < 7; i++) {
    ctx.beginPath()
    ctx.ellipse(
      256,
      16 + Math.random() * 32,
      230,
      1.2 + Math.random() * 2.5,
      0,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }

  return new THREE.CanvasTexture(canvas)
}

const windTex = createWindTexture()

for (let i = 0; i < 180; i++) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(
      18 + Math.random() * 32,
      0.8 + Math.random() * 1.8
    ),
    new THREE.MeshBasicMaterial({
      map: windTex,
      color: 0x9fc7ff,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })
  )

  const baseY = 3 + Math.random() * 18

  mesh.position.set(
    (Math.random() - 0.5) * 900,
    baseY,
    (Math.random() - 0.5) * 700
  )

  mesh.rotation.set(
    0,
    Math.random() * 0.35,
    (Math.random() - 0.5) * 0.08
  )

  mesh.userData = {
    speed: 0.05 + Math.random() * 0.12,
    floatOffset: Math.random() * Math.PI * 2,
    baseY,
    scaleBase: 0.75 + Math.random() * 0.8
  }

  windGroup.add(mesh)
}

// ─── Phase config ─────────────────────────────────────────────────────────────
const PHASES: Record<DayPhase, {
  el: number
  az: number
  exp: number
  turb: number
  ray: number
  mie: number
  lit: number
  ml: number
  am: number
  wc: number
}> = {
  night: {
    el: -8,
    az: 180,
    exp: 0.35,
    turb: 1.2,
    ray: 0.12,
    mie: 0.0008,
    lit: 0.05,
    ml: 1.6,
    am: 0.55,
    wc: 0x9fc7ff
  },

  sunrise: {
    el: 4,
    az: 115,
    exp: 0.45,
    turb: 6,
    ray: 1.2,
    mie: 0.0025,
    lit: 0.45,
    ml: 0,
    am: 0,
    wc: 0xffb36b
  },

  day: {
    el: 14,
    az: 180,
    exp: 0.38,
    turb: 3.2,
    ray: 0.75,
    mie: 0.0012,
    lit: 0.35,
    ml: 0,
    am: 0,
    wc: 0x73d8ff
  },

  sunset: {
    el: 3,
    az: 245,
    exp: 0.42,
    turb: 6,
    ray: 1.4,
    mie: 0.003,
    lit: 0.35,
    ml: 0.1,
    am: 0.04,
    wc: 0xff8a4c
  }
}

// ─── State ────────────────────────────────────────────────────────────────────
let currentDayPhase: DayPhase = 'day'
let currentWeatherData: WeatherData | null = null
let currentSeaState: SeaState | null = null
let isWeatherLoading = false
let selectedPlace = 'Rijeka'

// ─── Time helpers ─────────────────────────────────────────────────────────────
const getLocalDate = () =>
  currentWeatherData?.currentTime
    ? new Date(currentWeatherData.currentTime)
    : new Date()

const getLocalTimeStr = () =>
  new Date().toLocaleTimeString('en-US', {
    timeZone: currentWeatherData?.timezone || 'Europe/Zagreb',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

function getDayPhase(weather: WeatherData): DayPhase {
  const now = getLocalDate()
  const rise = new Date(weather.sunrise)
  const set = new Date(weather.sunset)

  const riseTime = rise.getTime()
  const setTime = set.getTime()

  if (
    !Number.isFinite(riseTime) ||
    !Number.isFinite(setTime) ||
    riseTime === setTime
  ) {
    const hour = Number(
      new Date().toLocaleString('en-US', {
        timeZone: weather.timezone || 'Europe/Zagreb',
        hour: '2-digit',
        hour12: false
      })
    )

    return hour >= 20 || hour <= 5 ? 'night' : 'day'
  }

  if (now < new Date(riseTime - 45 * 60000)) return 'night'
  if (now <= new Date(riseTime + 45 * 60000)) return 'sunrise'
  if (now < new Date(setTime - 60 * 60000)) return 'day'
  if (now <= new Date(setTime + 45 * 60000)) return 'sunset'

  return 'night'
}

function getSunElevation(weather: WeatherData) {
  const now = getLocalDate()
  const rise = new Date(weather.sunrise)
  const set = new Date(weather.sunset)

  const nowTime = now.getTime()
  const riseTime = rise.getTime()
  const setTime = set.getTime()

  if (
    !Number.isFinite(riseTime) ||
    !Number.isFinite(setTime) ||
    riseTime === setTime ||
    nowTime < riseTime ||
    nowTime > setTime
  ) {
    return -8
  }

  return Math.sin(((nowTime - riseTime) / (setTime - riseTime)) * Math.PI) * 45
}

// ─── Day/Night transition ─────────────────────────────────────────────────────
function applyDayPhase(phase: DayPhase, weather: WeatherData | null) {
  currentDayPhase = phase

  const phaseSettings = PHASES[phase] ?? PHASES.day

  renderer.toneMappingExposure = phaseSettings.exp

  su.turbidity.value = phaseSettings.turb
  su.rayleigh.value = phaseSettings.ray
  su.mieCoefficient.value = phaseSettings.mie

  const elevation = THREE.MathUtils.clamp(
    weather ? getSunElevation(weather) : phaseSettings.el,
    -8,
    phaseSettings.el
  )

  updateSun(elevation, phaseSettings.az)

  dirLight.intensity = phaseSettings.lit
  moonLight.intensity = phaseSettings.ml
  ambientNight.intensity = phaseSettings.am
  moonFill.intensity = phase === 'night' ? 0.55 : 0

  windGroup.children.forEach(ribbon => {
    const mesh = ribbon as THREE.Mesh
    const material = mesh.material as THREE.MeshBasicMaterial
    material.color.setHex(phaseSettings.wc)
  })

  const showStars = phase === 'night' || phase === 'sunset'

  nightGroup.visible = showStars
  starMat.opacity = phase === 'night' ? 0.95 : 0.55
  starMat.size = phase === 'night' ? 1.25 : 0.85
}

// ─── UI / Panel ───────────────────────────────────────────────────────────────
const weatherBox = Object.assign(document.createElement('div'), {
  className: 'weather-box'
})

const panelHeader = Object.assign(document.createElement('button'), {
  className: 'weather-panel-header',
  innerHTML: '<span>OCEANIS</span>'
})

const panelContent = Object.assign(document.createElement('div'), {
  className: 'weather-panel-content'
})

weatherBox.append(panelHeader, panelContent)
document.body.appendChild(weatherBox)

panelHeader.addEventListener('click', () => {
  weatherBox.classList.toggle('is-collapsed')
})

const _setPanel = (
  html: string,
  loading = false,
  onComplete: (() => void) | null = null
) => setPanel(weatherBox, panelContent, html, loading, onComplete)

function bindPanelSearch() {
  bindSearch((value: string) => {
    if (isWeatherLoading) return

    selectedPlace = value
    loadWeather()
  })
}

// ─── Weather fetch ────────────────────────────────────────────────────────────
async function loadWeather() {
  if (isWeatherLoading) return

  isWeatherLoading = true

  _setPanel(buildLoadingPanel(selectedPlace), true, () => {
    bindSearch((value: string) => {
      selectedPlace = value
      isWeatherLoading = false
      loadWeather()
    })
  })

  try {
    const weather = await getCurrentWeather(selectedPlace)

    currentWeatherData = weather
    selectedPlace = weather.place

    const seaState: SeaState = mapWeatherToSeaState(weather)
    const phase = getDayPhase(weather)

    seaState.windDirection = weather.windDirection
    currentSeaState = seaState

    applyDayPhase(phase, weather)
    document.body.dataset.phase = phase

    applySeaStateToWater(water, seaState, scene)

    windGroup.rotation.y = -THREE.MathUtils.degToRad(weather.windDirection)

    setTimeout(() => {
      _setPanel(
        buildWeatherPanel(weather, seaState, phase, getLocalTimeStr),
        false,
        bindPanelSearch
      )
    }, 260)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(err)

    setTimeout(() => {
      _setPanel(
        buildErrorPanel(selectedPlace, err.message),
        false,
        bindPanelSearch
      )
    }, 260)
  } finally {
    setTimeout(() => {
      weatherBox.classList.remove('is-loading')
      isWeatherLoading = false
    }, 520)
  }
}

// ─── Animation ────────────────────────────────────────────────────────────────
let lastTime = performance.now()

function animate() {
  requestAnimationFrame(animate)

  const now = performance.now()
  const delta = (now - lastTime) / 1000
  lastTime = now

  const t = now * 0.001

  updatePhysicalWaves(t)

  if (water.material.uniforms.time) {
    water.material.uniforms.time.value +=
      delta * (currentSeaState?.waveAnimationSpeed ?? water.userData.waveSpeed)
  }

  const strength = currentSeaState?.intensity ?? 0.25
  const storm = currentSeaState?.stormIntensity ?? 0

  const windFactor = THREE.MathUtils.clamp(
    ((currentWeatherData?.windSpeed ?? 5) / 60) + storm * 0.45,
    0.08,
    2.4
  )

  windGroup.children.forEach(ribbon => {
    const mesh = ribbon as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>

    const {
      floatOffset,
      baseY,
      scaleBase,
      speed
    } = mesh.userData as {
      floatOffset: number
      baseY: number
      scaleBase: number
      speed: number
    }

    mesh.material.opacity =
      0.08 +
      strength * 0.32 +
      storm * 0.18 +
      Math.sin(t * 2 + floatOffset) * 0.04

    mesh.position.x += speed * windFactor * 24

    mesh.position.y =
      baseY +
      Math.sin(t * 1.4 + floatOffset) * (0.45 + storm * 0.35)

    mesh.scale.set(
      scaleBase + Math.sin(t * 1.2 + floatOffset) * (0.08 + storm * 0.05),
      0.85 + Math.sin(t * 1.8 + floatOffset) * (0.12 + storm * 0.08),
      1
    )

    if (mesh.position.x > 450) {
      mesh.position.x = -450
      mesh.position.y = mesh.userData.baseY = 3 + Math.random() * 18
      mesh.position.z = (Math.random() - 0.5) * 700
    }
  })

  if (nightGroup.visible) {
    stars.rotation.y += delta * 0.01
  }

  controls.update()
  renderer.render(scene, camera)
}

animate()

// ─── Intervals & resize ───────────────────────────────────────────────────────
setInterval(() => {
  const timeEl = document.querySelector<HTMLElement>('#live-time')

  if (timeEl) {
    timeEl.textContent = getLocalTimeStr()
  }

  if (!currentWeatherData) return

  const phase = getDayPhase(currentWeatherData)

  if (phase === currentDayPhase) return

  applyDayPhase(phase, currentWeatherData)
  document.body.dataset.phase = phase

  const label = document.querySelector<HTMLElement>('#day-phase-label')

  if (label) {
    label.textContent = PHASE_LABELS[phase]
  }
}, 1000)

setInterval(loadWeather, 10 * 60 * 1000)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

loadWeather()

window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader')

  setTimeout(() => {
    preloader?.classList.add('hidden')
  }, 1400)
})