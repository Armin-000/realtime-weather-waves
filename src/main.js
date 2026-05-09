import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import { getCurrentWeather } from './weather/weatherService.js'
import { mapWindToSeaState, applySeaStateToWater } from './water/weatherWaves.js'
import {
  buildWeatherPanel,
  buildLoadingPanel,
  buildErrorPanel,
  setPanel,
  bindSearch,
  PHASE_LABELS
} from './panel/panelBuilder.js'
import './style.css'

// ─── Renderer / Scene / Camera ───────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
Object.assign(renderer, { toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.50 })
document.querySelector('#app').appendChild(renderer.domElement)

const scene  = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 20000)
camera.position.set(0, 5, 28)

const controls = new OrbitControls(camera, renderer.domElement)
Object.assign(controls, { enableDamping: true, minDistance: 8, maxDistance: 120, maxPolarAngle: Math.PI * 0.48 })
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
  t => { t.wrapS = t.wrapT = THREE.RepeatWrapping }
)

const water = new Water(new THREE.PlaneGeometry(10000, 10000), {
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
water.userData = { waveSpeed: 0.65, choppiness: 0.55, windDirection: 315 }
scene.add(water)

// ─── Lighting ────────────────────────────────────────────────────────────────
const sun       = new THREE.Vector3()
const pmrem     = new THREE.PMREMGenerator(renderer)
let   envTarget = null

const dirLight     = new THREE.DirectionalLight(0xffffff, 2)
const moonLight    = new THREE.DirectionalLight(0xc7ddff, 0)
const ambientNight = new THREE.AmbientLight(0x7da7d9, 0)
const moonFill     = new THREE.HemisphereLight(0x9fc7ff, 0x020817, 0)

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

const starPos = new Float32Array(900 * 3)

for (let i = 0; i < 900; i++) {
  starPos[i * 3]     = (Math.random() - 0.5) * 700
  starPos[i * 3 + 1] = 35 + Math.random() * 240
  starPos[i * 3 + 2] = -100 - Math.random() * 550
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
  const c = Object.assign(document.createElement('canvas'), {
    width: 512,
    height: 64
  })

  const ctx = c.getContext('2d')
  const g   = ctx.createLinearGradient(0, 0, 512, 0)

  ;[
    [0,    'rgba(255,255,255,0)'],
    [0.18, 'rgba(255,255,255,0.18)'],
    [0.5,  'rgba(255,255,255,0.75)'],
    [0.82, 'rgba(255,255,255,0.18)'],
    [1,    'rgba(255,255,255,0)']
  ].forEach(([s, c]) => g.addColorStop(s, c))

  ctx.fillStyle = g

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

  return new THREE.CanvasTexture(c)
}

const windTex = createWindTexture()

for (let i = 0; i < 55; i++) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(9 + Math.random() * 16, 0.45 + Math.random() * 1.1),
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
    (Math.random() - 0.5) * 95,
    baseY,
    (Math.random() - 0.5) * 70
  )

  mesh.rotation.set(0, Math.random() * 0.35, (Math.random() - 0.5) * 0.08)

  mesh.userData = {
    speed: 0.05 + Math.random() * 0.12,
    floatOffset: Math.random() * Math.PI * 2,
    baseY,
    scaleBase: 0.75 + Math.random() * 0.8
  }

  windGroup.add(mesh)
}

// ─── Phase config ─────────────────────────────────────────────────────────────
const PHASES = {
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
let currentDayPhase    = 'day'
let currentWeatherData = null
let currentSeaState    = null
let isWeatherLoading   = false
let selectedPlace      = 'Rijeka'

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

function getDayPhase(w) {
  const now  = getLocalDate()
  const rise = new Date(w.sunrise)
  const set  = new Date(w.sunset)

  if (now < new Date(+rise - 45 * 60000)) return 'night'
  if (now <= new Date(+rise + 45 * 60000)) return 'sunrise'
  if (now < new Date(+set - 60 * 60000)) return 'day'
  if (now <= new Date(+set + 45 * 60000)) return 'sunset'

  return 'night'
}

function getSunElevation(w) {
  const now  = getLocalDate()
  const rise = new Date(w.sunrise)
  const set  = new Date(w.sunset)

  if (now < rise || now > set) return -8

  return Math.sin(((now - rise) / (set - rise)) * Math.PI) * 45
}

// ─── Day/Night transition ─────────────────────────────────────────────────────
function applyDayPhase(phase, weather) {
  currentDayPhase = phase

  const s = PHASES[phase] ?? PHASES.day

  renderer.toneMappingExposure = s.exp

  su.turbidity.value      = s.turb
  su.rayleigh.value       = s.ray
  su.mieCoefficient.value = s.mie

  const elevation = THREE.MathUtils.clamp(
    weather ? getSunElevation(weather) : s.el,
    -8,
    s.el
  )

  updateSun(elevation, s.az)

  dirLight.intensity     = s.lit
  moonLight.intensity    = s.ml
  ambientNight.intensity = s.am
  moonFill.intensity     = phase === 'night' ? 0.55 : 0

  windGroup.children.forEach(r => r.material.color.setHex(s.wc))

  nightGroup.visible = phase === 'night'
  starMat.opacity    = phase === 'night' ? 0.95 : 0
}

// ─── UI / Panel ───────────────────────────────────────────────────────────────
const weatherBox = Object.assign(document.createElement('div'), {
  className: 'weather-box'
})

const panelHeader = Object.assign(document.createElement('button'), {
  className: 'weather-panel-header',
  innerHTML: '<span>Weather & Waves</span>'
})

const panelContent = Object.assign(document.createElement('div'), {
  className: 'weather-panel-content'
})

weatherBox.append(panelHeader, panelContent)
document.body.appendChild(weatherBox)

panelHeader.addEventListener('click', () => {
  weatherBox.classList.toggle('is-collapsed')
})

const _setPanel = (html, loading = false, onComplete = null) =>
  setPanel(weatherBox, panelContent, html, loading, onComplete)

function bindPanelSearch() {
  bindSearch(v => {
    if (isWeatherLoading) return
    selectedPlace = v
    loadWeather()
  })
}

// ─── Weather fetch ────────────────────────────────────────────────────────────
async function loadWeather() {
  if (isWeatherLoading) return

  isWeatherLoading = true

  _setPanel(buildLoadingPanel(selectedPlace), true, () => {
    bindSearch(v => {
      selectedPlace = v
      isWeatherLoading = false
      loadWeather()
    })
  })

  try {
    const weather = await getCurrentWeather(selectedPlace)

    currentWeatherData = weather
    selectedPlace = weather.place

    const seaState = mapWindToSeaState(weather.windSpeed, weather.waveHeight)
    const phase    = getDayPhase(weather)

    seaState.windDirection = weather.windDirection
    currentSeaState = seaState

    applyDayPhase(phase, weather)
    document.body.dataset.phase = phase

    applySeaStateToWater(water, seaState, scene)

    windGroup.rotation.y = -THREE.MathUtils.degToRad(weather.windDirection)

    setTimeout(() => {
      _setPanel(buildWeatherPanel(weather, seaState, phase, getLocalTimeStr), false, bindPanelSearch)
    }, 260)

  } catch (err) {
    console.error(err)

    setTimeout(() => {
      _setPanel(buildErrorPanel(selectedPlace, err.message), false, bindPanelSearch)
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

  const now   = performance.now()
  const delta = (now - lastTime) / 1000
  lastTime    = now
  const t     = now * 0.001

  // Water
  if (water.material.uniforms.time) {
    water.material.uniforms.time.value +=
      delta * (currentSeaState?.waveAnimationSpeed ?? water.userData.waveSpeed)
  }

  // Wind
  const strength   = currentSeaState?.intensity ?? 0.25
  const windFactor = THREE.MathUtils.clamp(
    (currentWeatherData?.windSpeed ?? 5) / 60,
    0.08,
    1.8
  )

  windGroup.children.forEach(r => {
    const { floatOffset: fo, baseY, scaleBase, speed } = r.userData

    r.material.opacity = 0.08 + strength * 0.32 + Math.sin(t * 2 + fo) * 0.04
    r.position.x += speed * windFactor * 24
    r.position.y  = baseY + Math.sin(t * 1.4 + fo) * 0.45

    r.scale.set(
      scaleBase + Math.sin(t * 1.2 + fo) * 0.08,
      0.85 + Math.sin(t * 1.8 + fo) * 0.12,
      1
    )

    if (r.position.x > 55) {
      r.position.x = -55
      r.position.y = r.userData.baseY = 3 + Math.random() * 18
      r.position.z = (Math.random() - 0.5) * 70
    }
  })

  // Night sky
  if (nightGroup.visible) {
    stars.rotation.y += delta * 0.01
  }

  controls.update()
  renderer.render(scene, camera)
}

animate()

// ─── Intervals & resize ───────────────────────────────────────────────────────
setInterval(() => {
  const timeEl = document.querySelector('#live-time')
  if (timeEl) timeEl.textContent = getLocalTimeStr()

  if (!currentWeatherData) return

  const phase = getDayPhase(currentWeatherData)

  if (phase === currentDayPhase) return

  applyDayPhase(phase, currentWeatherData)
  document.body.dataset.phase = phase

  const lbl = document.querySelector('#day-phase-label')
  if (lbl) lbl.textContent = PHASE_LABELS[phase]
}, 1000)

setInterval(loadWeather, 10 * 60 * 1000)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

loadWeather()