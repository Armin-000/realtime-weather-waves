import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'

import { getCurrentWeather, searchPlaces } from './weather/weatherService'
import { mapWeatherToSeaState, applySeaStateToWater } from './water/weatherWaves'
import { RainSystem } from './environment/RainSystem'
import { StormAtmosphere } from './environment/StormAtmosphere'

import { HorizonSilhouettes } from './environment/HorizonSilhouettes'

import { RealisticSky } from './environment/RealisticSky'

import {
  buildWeatherPanel,
  buildCompassHud,
  buildLoadingPanel,
  buildErrorPanel,
  setPanel,
  bindSearch,
  PHASE_LABELS
} from './panel/panelBuilder'

import './style.css'

type WeatherData = Awaited<ReturnType<typeof getCurrentWeather>>
type SeaState = ReturnType<typeof mapWeatherToSeaState> & { windDirection?: number }
type DayPhase = 'night' | 'sunrise' | 'day' | 'sunset'

type GpuWaveUniforms = {
  uWaveTime: { value: number }
  uWaveIntensity: { value: number }
  uWaveHeight: { value: number }
  uWaveFrequency: { value: number }
  uWaveSpeed: { value: number }
  uStormIntensity: { value: number }
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('App container was not found.')

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
  enablePan: true,
  minDistance: 8,
  maxDistance: 320,
  minPolarAngle: 0.05,
  maxPolarAngle: Math.PI * 0.95,
  minAzimuthAngle: -Infinity,
  maxAzimuthAngle: Infinity
})

controls.target.set(0, 60, 0)
controls.update()

// ─── Sky & Water ─────────────────────────────────────────────────────────────

const sky = new Sky()
sky.scale.setScalar(10000)
scene.add(sky)

const su = sky.material.uniforms

su.turbidity.value = 3.2
su.rayleigh.value = 1.1
su.mieCoefficient.value = 0.0015
su.mieDirectionalG.value = 0.82

const waterNormals = new THREE.TextureLoader().load(
  'https://threejs.org/examples/textures/waternormals.jpg',
  texture => {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
  }
)

const water = new Water(new THREE.PlaneGeometry(6000, 6000, 520, 520), {
  textureWidth: 1024,
  textureHeight: 1024,
  waterNormals,
  sunDirection: new THREE.Vector3(),
  sunColor: 0xd8ecff,
  waterColor: 0x00324d,
  distortionScale: 3.7,
  fog: false
})

water.rotation.x = -Math.PI / 2

water.userData = {
  waveSpeed: 0.65,
  choppiness: 0.55,
  windDirection: 315,
  stormIntensity: 0
}

scene.add(water)

// ─── GPU Ocean Waves ─────────────────────────────────────────────────────────

const gpu: GpuWaveUniforms = {
  uWaveTime: { value: 0 },
  uWaveIntensity: { value: 0.25 },
  uWaveHeight: { value: 0.35 },
  uWaveFrequency: { value: 0.003 },
  uWaveSpeed: { value: 1 },
  uStormIntensity: { value: 0 }
}

function installGpuWaveShader(w: Water) {
  const mat = w.material as THREE.ShaderMaterial

  Object.assign(mat.uniforms, gpu)

  mat.vertexShader = mat.vertexShader
    .replace(
      'void main() {',
      `
    uniform float uWaveTime, uWaveIntensity, uWaveHeight, uWaveFrequency, uWaveSpeed, uStormIntensity;

    float oceanWaveLayer(vec3 p, float frequency, float speed, float phase) {
      float t = uWaveTime * speed * uWaveSpeed;

      return sin(p.x * frequency + t + phase) * 0.42
           + sin(p.y * frequency * 1.37 + t * 0.82 - phase) * 0.31
           + sin((p.x + p.y) * frequency * 0.72 + t * 1.28) * 0.18
           + sin((p.x - p.y) * frequency * 1.58 - t * 0.64) * 0.09;
    }

    float getOceanHeight(vec3 p) {
      float amp  = 0.6 + uWaveHeight * 3.2 + uWaveIntensity * 2.4 + uStormIntensity * 4.5;
      float freq = 0.002 + uWaveFrequency + uWaveIntensity * 0.003 + uStormIntensity * 0.0025;

      return (oceanWaveLayer(p, freq, 1.0, 0.0)
            + oceanWaveLayer(p, freq * 2.1, 1.45, 1.7) * 0.45
            + oceanWaveLayer(p, freq * 4.3, 2.25, 3.4) * 0.18 * (0.6 + uStormIntensity)) * amp;
    }

    void main() {`
    )
    .replace(
      'mirrorCoord = modelMatrix * vec4( position, 1.0 );',
      `vec3 displacedPosition = position;
       displacedPosition.z += getOceanHeight(position);
       mirrorCoord = modelMatrix * vec4( displacedPosition, 1.0 );`
    )
    .replace(
      /vec4\s+mvPosition\s*=\s*modelViewMatrix\s*\*\s*vec4\(\s*position\s*,\s*1\.0\s*\)\s*;/,
      'vec4 mvPosition = modelViewMatrix * vec4( displacedPosition, 1.0 );'
    )

  mat.needsUpdate = true
}

function updateGpuWaveUniforms(t: number, sea: SeaState | null) {
  gpu.uWaveTime.value = t

  if (!sea) return

  const { clamp, lerp } = THREE.MathUtils

  const wh = clamp(sea.waveHeight ?? 0.35, 0, 8)
  const ws = clamp(currentWeatherData?.windSpeed ?? 0, 0, 120)
  const storm = clamp(sea.stormIntensity ?? 0, 0, 1)
  const smooth = 0.025

  const targets = {
    uWaveIntensity: clamp(
      0.16 +
        clamp(wh / 3.5, 0, 1) * 0.75 +
        clamp(ws / 70, 0, 1) * 0.2 +
        storm * 0.35,
      0.12,
      1.6
    ),
    uWaveHeight: clamp(0.4 + Math.pow(wh, 1.35) * 1.4, 0.3, 8),
    uWaveFrequency: clamp(sea.waveFrequency ?? 0.003, 0.0015, 0.009),
    uWaveSpeed: clamp(sea.waveAnimationSpeed ?? 1, 0.35, 4.2),
    uStormIntensity: storm
  }

  for (const key of Object.keys(targets) as Array<keyof typeof targets>) {
    gpu[key].value = lerp(gpu[key].value, targets[key], smooth)
  }
}

installGpuWaveShader(water)

// ─── Infinite Ocean ──────────────────────────────────────────────────────────

const oceanTileSize = 3000

function updateInfiniteOcean() {
  water.position.x =
    Math.round(camera.position.x / oceanTileSize) * oceanTileSize

  water.position.z =
    Math.round(camera.position.z / oceanTileSize) * oceanTileSize
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

const starPos = new Float32Array(3000 * 3)

for (let i = 0; i < 3000; i++) {
  const theta = Math.random() * Math.PI * 2
  const phi = THREE.MathUtils.degToRad(15 + Math.random() * 70)

  starPos[i * 3] = Math.cos(theta) * Math.cos(phi) * 1800
  starPos[i * 3 + 1] = Math.sin(phi) * 1800
  starPos[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * 1800
}

const starGeo = new THREE.BufferGeometry()
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))

const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 4.5,
  sizeAttenuation: false,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  depthTest: false,
  fog: false
})

const stars = new THREE.Points(starGeo, starMat)

nightGroup.add(stars)
nightGroup.visible = false

// ─── Wind ribbons ────────────────────────────────────────────────────────────

const windGroup = new THREE.Group()
scene.add(windGroup)

function createWindTexture() {
  const canvas = Object.assign(document.createElement('canvas'), {
    width: 512,
    height: 64
  })

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context could not be created.')

  const gradient = ctx.createLinearGradient(0, 0, 512, 0)

  ;[
    [0, 'rgba(255,255,255,0)'],
    [0.18, 'rgba(255,255,255,0.18)'],
    [0.5, 'rgba(255,255,255,0.75)'],
    [0.82, 'rgba(255,255,255,0.18)'],
    [1, 'rgba(255,255,255,0)']
  ].forEach(([stop, color]) => {
    gradient.addColorStop(stop as number, color as string)
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

// ─── Environment Effects ─────────────────────────────────────────────────────

const rainSystem = new RainSystem()
scene.add(rainSystem.group)

const stormAtmosphere = new StormAtmosphere(scene, renderer)

const realisticSky = new RealisticSky(scene, camera)

const horizonSilhouettes = new HorizonSilhouettes()
scene.add(horizonSilhouettes.group)

// ─── Phase config ────────────────────────────────────────────────────────────

const PHASES: Record<
  DayPhase,
  {
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
  }
> = {
  night: {
    el: -8,
    az: 180,
    exp: 0.34,
    turb: 1.4,
    ray: 0.16,
    mie: 0.001,
    lit: 0.04,
    ml: 1.65,
    am: 0.58,
    wc: 0x9fc7ff
  },
  sunrise: {
    el: 5,
    az: 115,
    exp: 0.48,
    turb: 8.5,
    ray: 2.1,
    mie: 0.0045,
    lit: 0.62,
    ml: 0,
    am: 0.08,
    wc: 0xffb36b
  },
  day: {
    el: 18,
    az: 180,
    exp: 0.46,
    turb: 3.2,
    ray: 1.05,
    mie: 0.0015,
    lit: 0.52,
    ml: 0,
    am: 0,
    wc: 0x73d8ff
  },
  sunset: {
    el: 4,
    az: 245,
    exp: 0.44,
    turb: 10.5,
    ray: 2.7,
    mie: 0.0055,
    lit: 0.5,
    ml: 0.16,
    am: 0.08,
    wc: 0xff8a4c
  }
}

// ─── State ──────────────────────────────────────────────────────────────────

let currentDayPhase: DayPhase = 'day'
let currentWeatherData: WeatherData | null = null
let currentSeaState: SeaState | null = null
let isWeatherLoading = false
let selectedPlace = 'Rijeka'

// ─── Time helpers ────────────────────────────────────────────────────────────

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
  const rise = new Date(weather.sunrise).getTime()
  const set = new Date(weather.sunset).getTime()

  if (!Number.isFinite(rise) || !Number.isFinite(set) || rise === set) {
    const hour = Number(
      new Date().toLocaleString('en-US', {
        timeZone: weather.timezone || 'Europe/Zagreb',
        hour: '2-digit',
        hour12: false
      })
    )

    return hour >= 20 || hour <= 5 ? 'night' : 'day'
  }

  const time = now.getTime()

  if (time < rise - 45 * 60000) return 'night'
  if (time <= rise + 45 * 60000) return 'sunrise'
  if (time < set - 60 * 60000) return 'day'
  if (time <= set + 45 * 60000) return 'sunset'

  return 'night'
}

function getSunElevation(weather: WeatherData) {
  const now = getLocalDate().getTime()
  const rise = new Date(weather.sunrise).getTime()
  const set = new Date(weather.sunset).getTime()

  if (
    !Number.isFinite(rise) ||
    !Number.isFinite(set) ||
    rise === set ||
    now < rise ||
    now > set
  ) {
    return -8
  }

  return Math.sin(((now - rise) / (set - rise)) * Math.PI) * 45
}

// ─── Day/Night transition ───────────────────────────────────────────────────

function applyDayPhase(phase: DayPhase, weather: WeatherData | null) {
  currentDayPhase = phase

  const p = PHASES[phase] ?? PHASES.day

  renderer.toneMappingExposure = p.exp

  su.turbidity.value = p.turb
  su.rayleigh.value = p.ray
  su.mieCoefficient.value = p.mie

  updateSun(
    THREE.MathUtils.clamp(
      weather ? getSunElevation(weather) : p.el,
      -8,
      p.el
    ),
    p.az
  )

  dirLight.intensity = p.lit
  moonLight.intensity = p.ml
  ambientNight.intensity = p.am
  moonFill.intensity = phase === 'night' ? 0.55 : 0

  windGroup.children.forEach(ribbon => {
    const mesh = ribbon as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
    mesh.material.color.setHex(p.wc)
  })

  nightGroup.visible = phase === 'night' || phase === 'sunset'
  starMat.opacity = phase === 'night' ? 0.95 : 0.55
  starMat.size = phase === 'night' ? 1.25 : 0.85

  horizonSilhouettes.setPhaseMood(phase)
}

// ─── UI / Panel ──────────────────────────────────────────────────────────────

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

const compassHud = Object.assign(document.createElement('div'), {
  className: 'floating-compass-hud'
})

weatherBox.append(panelHeader, panelContent)
document.body.append(weatherBox, compassHud)

panelHeader.addEventListener('click', () => {
  weatherBox.classList.toggle('is-collapsed')
})

const _setPanel = (
  html: string,
  loading = false,
  onComplete: (() => void) | null = null
) => setPanel(weatherBox, panelContent, html, loading, onComplete)

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

function bindDetailsToggle() {
  const toggle = document.querySelector<HTMLButtonElement>('#details-toggle')
  const details = document.querySelector<HTMLDivElement>('#weather-details')

  if (!toggle || !details) return

  toggle.addEventListener('click', () => {
    const isOpen = details.classList.toggle('is-open')

    toggle.classList.toggle('is-open', isOpen)

    const icon = toggle.querySelector('strong')

    if (icon) {
      icon.textContent = isOpen ? '−' : '+'
    }
  })
}

function bindPanelAutocompleteSearch() {
  bindSearch((value: string) => {
    if (!isWeatherLoading) {
      selectedPlace = value
      loadWeather()
    }
  })

  bindDetailsToggle()

  const input = document.querySelector<HTMLInputElement>('#city-input')
  const suggestionsBox = document.querySelector<HTMLDivElement>('#city-suggestions')

  if (!input || !suggestionsBox) return

  let debounceTimer: number | null = null
  let requestId = 0

  const closeSuggestions = () => {
    suggestionsBox.innerHTML = ''
    suggestionsBox.classList.remove('is-visible')
  }

  const renderSuggestions = (
    places: Awaited<ReturnType<typeof searchPlaces>>
  ) => {
    if (!places.length) {
      closeSuggestions()
      return
    }

    suggestionsBox.innerHTML = places
      .map(place => {
        const title = escapeHtml(place.name)
        const country = escapeHtml(place.country || '')
        const admin = place.admin1 ? ` · ${escapeHtml(place.admin1)}` : ''
        const value = escapeHtml(place.name)

        return `
          <button class="city-suggestion" type="button" data-place="${value}">
            <span>${title}</span>
            <small>${country}${admin}</small>
          </button>
        `
      })
      .join('')

    suggestionsBox.classList.add('is-visible')

    suggestionsBox
      .querySelectorAll<HTMLButtonElement>('.city-suggestion')
      .forEach(button => {
        button.addEventListener('click', () => {
          const place = button.dataset.place

          if (!place || isWeatherLoading) return

          input.value = place
          selectedPlace = place

          closeSuggestions()
          loadWeather()
        })
      })
  }

  input.addEventListener('input', () => {
    const value = input.value.trim()

    if (debounceTimer) {
      window.clearTimeout(debounceTimer)
    }

    if (value.length < 1) {
      closeSuggestions()
      return
    }

    debounceTimer = window.setTimeout(async () => {
      const currentRequest = ++requestId

      try {
        const places = await searchPlaces(value)

        if (currentRequest !== requestId) return

        renderSuggestions(places)
      } catch (error) {
        console.warn('Autocomplete failed:', error)
        closeSuggestions()
      }
    }, 250)
  })

  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeSuggestions()
    }
  })

  document.addEventListener('click', event => {
    const target = event.target as Node

    if (!input.contains(target) && !suggestionsBox.contains(target)) {
      closeSuggestions()
    }
  })
}

// ─── Weather fetch ───────────────────────────────────────────────────────────

async function loadWeather() {
  if (isWeatherLoading) return

  isWeatherLoading = true

  _setPanel(buildLoadingPanel(selectedPlace), true, bindPanelAutocompleteSearch)

  try {
    const weather = await getCurrentWeather(selectedPlace)

    currentWeatherData = weather
    selectedPlace = weather.place

    const seaState: SeaState = mapWeatherToSeaState(weather)
    const phase = getDayPhase(weather)

    seaState.windDirection = weather.windDirection
    currentSeaState = seaState

    applyDayPhase(phase, weather)

    stormAtmosphere.setBaseFromCurrentScene()

    document.body.dataset.phase = phase

    applySeaStateToWater(water, seaState, scene)

    windGroup.rotation.y = -THREE.MathUtils.degToRad(weather.windDirection)

    rainSystem.setIntensity(weather.precipitationIntensity ?? 0)

    stormAtmosphere.setStormState({
      isRaining: weather.isRaining,
      precipitationIntensity: weather.precipitationIntensity,
      stormIntensity: seaState.stormIntensity,
      cloudCover: weather.cloudCover,
      weatherCode: weather.weatherCode,
      isDay: weather.isDay
    })

    const atmosphereAmount = Math.max(
      weather.precipitationIntensity ?? 0,
      seaState.stormIntensity ?? 0
    )

    horizonSilhouettes.setStormAmount(atmosphereAmount)

    realisticSky.setMood({
      phase,
      cloudCover: weather.cloudCover,
      precipitationIntensity: weather.precipitationIntensity,
      stormIntensity: seaState.stormIntensity,
      isRaining: weather.isRaining
    })

    compassHud.innerHTML = buildCompassHud(weather)

    setTimeout(() => {
      _setPanel(
        buildWeatherPanel(weather, seaState, phase, getLocalTimeStr),
        false,
        bindPanelAutocompleteSearch
      )
    }, 260)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))

    console.error(err)

    setTimeout(() => {
      _setPanel(
        buildErrorPanel(selectedPlace, err.message),
        false,
        bindPanelAutocompleteSearch
      )
    }, 260)
  } finally {
    setTimeout(() => {
      weatherBox.classList.remove('is-loading')
      isWeatherLoading = false
    }, 520)
  }
}

// ─── Animation ───────────────────────────────────────────────────────────────

let lastTime = performance.now()

function animate() {
  requestAnimationFrame(animate)

  const now = performance.now()
  const delta = (now - lastTime) / 1000

  lastTime = now

  const t = now * 0.001

  updateGpuWaveUniforms(t, currentSeaState)

  if (water.material.uniforms.time) {
    water.material.uniforms.time.value +=
      delta *
      (currentSeaState?.waveAnimationSpeed ?? water.userData.waveSpeed)
  }

  const strength = currentSeaState?.intensity ?? 0.25
  const storm = currentSeaState?.stormIntensity ?? 0

  const windFactor = THREE.MathUtils.clamp(
    ((currentWeatherData?.windSpeed ?? 5) / 60) + storm * 0.45,
    0.08,
    2.4
  )

  windGroup.children.forEach(ribbon => {
    const mesh = ribbon as THREE.Mesh<
      THREE.PlaneGeometry,
      THREE.MeshBasicMaterial
    >

    const { floatOffset, baseY, scaleBase, speed } = mesh.userData as {
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
      baseY + Math.sin(t * 1.4 + floatOffset) * (0.45 + storm * 0.35)

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

  rainSystem.update(
    delta,
    currentWeatherData?.windDirection ?? 0,
    currentWeatherData?.windSpeed ?? 0
  )

  stormAtmosphere.update(delta)

  updateInfiniteOcean()

  realisticSky.update(delta, currentWeatherData?.windSpeed ?? 0)

  const horizonDistance = 1800

  horizonSilhouettes.group.position.set(
    camera.position.x,
    -12,
    camera.position.z - horizonDistance
  )

  if (nightGroup.visible) {
    nightGroup.position.copy(camera.position)
    stars.rotation.y += delta * 0.01
  }

  if (camera.position.y < 2.5) {
    camera.position.y = 2.5
  }

  controls.update()
  renderer.render(scene, camera)
}

animate()

// ─── Intervals & resize ─────────────────────────────────────────────────────

setInterval(() => {
  const timeEl = document.querySelector<HTMLElement>('#live-time')

  if (timeEl) {
    timeEl.textContent = getLocalTimeStr()
  }

  if (!currentWeatherData) return

  const phase = getDayPhase(currentWeatherData)

  if (phase === currentDayPhase) return

  applyDayPhase(phase, currentWeatherData)

  stormAtmosphere.setBaseFromCurrentScene()

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
  setTimeout(() => {
    document.getElementById('preloader')?.classList.add('hidden')
  }, 1400)
})