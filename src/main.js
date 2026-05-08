import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import {
  getCurrentWeather
} from './weather/weatherService.js'
import {
  mapWindToSeaState,
  applySeaStateToWater
} from './water/weatherWaves.js'
import './style.css'

const app = document.querySelector('#app')

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  20000
)

camera.position.set(0, 8, 28)

const renderer = new THREE.WebGLRenderer({
  antialias: true
})

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.1

app.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 0, 0)
controls.minDistance = 8
controls.maxDistance = 120
controls.maxPolarAngle = Math.PI * 0.48
controls.update()

const sun = new THREE.Vector3()
const textureLoader = new THREE.TextureLoader()

const waterGeometry = new THREE.PlaneGeometry(10000, 10000)

const waterNormals = textureLoader.load(
  'https://threejs.org/examples/textures/waternormals.jpg',
  (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  }
)

const water = new Water(waterGeometry, {
  textureWidth: 1024,
  textureHeight: 1024,
  waterNormals,
  sunDirection: new THREE.Vector3(),
  sunColor: 0xffffff,
  waterColor: 0x00324d,
  distortionScale: 3.7,
  fog: true
})

water.rotation.x = -Math.PI / 2

water.userData = {
  waveSpeed: 0.65,
  choppiness: 0.55,
  windDirection: 315
}

scene.add(water)

const sky = new Sky()
sky.scale.setScalar(10000)
scene.add(sky)

const skyUniforms = sky.material.uniforms
skyUniforms.turbidity.value = 6
skyUniforms.rayleigh.value = 1.8
skyUniforms.mieCoefficient.value = 0.004
skyUniforms.mieDirectionalG.value = 0.78

const nightGroup = new THREE.Group()
scene.add(nightGroup)

const moonTexture = textureLoader.load(
  'https://threejs.org/examples/textures/planets/moon_1024.jpg'
)

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(4.4, 64, 64),
  new THREE.MeshStandardMaterial({
    map: moonTexture,
    color: 0xf4f0d8,
    emissive: 0x2b2f3a,
    emissiveIntensity: 0.35,
    roughness: 0.9,
    metalness: 0
  })
)

moon.position.set(-42, 55, -90)
nightGroup.add(moon)

const moonGlow = new THREE.Mesh(
  new THREE.SphereGeometry(7.8, 64, 64),
  new THREE.MeshBasicMaterial({
    color: 0xbfdcff,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })
)

moonGlow.position.copy(moon.position)
nightGroup.add(moonGlow)

const moonHalo = new THREE.Mesh(
  new THREE.SphereGeometry(12, 64, 64),
  new THREE.MeshBasicMaterial({
    color: 0x8abfff,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })
)

moonHalo.position.copy(moon.position)
nightGroup.add(moonHalo)

const starGeometry = new THREE.BufferGeometry()
const starCount = 900
const starPositions = []

for (let i = 0; i < starCount; i++) {
  const x = (Math.random() - 0.5) * 700
  const y = 35 + Math.random() * 240
  const z = -100 - Math.random() * 550

  starPositions.push(x, y, z)
}

starGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starPositions, 3)
)

const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 1.25,
  transparent: true,
  opacity: 0
})

const stars = new THREE.Points(starGeometry, starMaterial)
nightGroup.add(stars)

nightGroup.visible = false

const pmremGenerator = new THREE.PMREMGenerator(renderer)
let environmentTarget = null

function updateEnvironment() {
  if (environmentTarget) {
    environmentTarget.dispose()
  }

  environmentTarget = pmremGenerator.fromScene(sky)
  scene.environment = environmentTarget.texture
}

const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
scene.add(directionalLight)

const moonLight = new THREE.DirectionalLight(0xc7ddff, 0)
moonLight.position.set(-40, 70, -80)
scene.add(moonLight)

const ambientNightLight = new THREE.AmbientLight(0x7da7d9, 0)
scene.add(ambientNightLight)

const moonFillLight = new THREE.HemisphereLight(0x9fc7ff, 0x020817, 0)
scene.add(moonFillLight)

function setSunPosition(elevation = 18, azimuth = 180) {
  const phi = THREE.MathUtils.degToRad(90 - elevation)
  const theta = THREE.MathUtils.degToRad(azimuth)

  sun.setFromSphericalCoords(1, phi, theta)

  sky.material.uniforms.sunPosition.value.copy(sun)
  water.material.uniforms.sunDirection.value.copy(sun).normalize()

  directionalLight.position.copy(sun).multiplyScalar(100)

  updateEnvironment()
}

setSunPosition(18, 180)

const windGroup = new THREE.Group()
scene.add(windGroup)

function createWindTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 64

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
  gradient.addColorStop(0, 'rgba(255,255,255,0)')
  gradient.addColorStop(0.18, 'rgba(255,255,255,0.18)')
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.75)')
  gradient.addColorStop(0.82, 'rgba(255,255,255,0.18)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')

  ctx.fillStyle = gradient

  for (let i = 0; i < 7; i++) {
    const y = 16 + Math.random() * 32
    const height = 1.2 + Math.random() * 2.5

    ctx.beginPath()
    ctx.ellipse(
      canvas.width / 2,
      y,
      canvas.width * 0.45,
      height,
      0,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  return texture
}

const windTexture = createWindTexture()

const windMaterial = new THREE.MeshBasicMaterial({
  map: windTexture,
  color: 0x9fc7ff,
  transparent: true,
  opacity: 0.38,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide
})

for (let i = 0; i < 55; i++) {
  const windRibbon = new THREE.Mesh(
    new THREE.PlaneGeometry(9 + Math.random() * 16, 0.45 + Math.random() * 1.1),
    windMaterial.clone()
  )

  windRibbon.position.set(
    (Math.random() - 0.5) * 95,
    3 + Math.random() * 18,
    (Math.random() - 0.5) * 70
  )

  windRibbon.rotation.y = Math.random() * 0.35
  windRibbon.rotation.z = (Math.random() - 0.5) * 0.08

  windRibbon.userData.speed = 0.05 + Math.random() * 0.12
  windRibbon.userData.floatOffset = Math.random() * Math.PI * 2
  windRibbon.userData.baseY = windRibbon.position.y
  windRibbon.userData.scaleBase = 0.75 + Math.random() * 0.8

  windGroup.add(windRibbon)
}

const weatherBox = document.createElement('div')
weatherBox.className = 'weather-box'
weatherBox.innerHTML = `
  <h2>Weather & Waves</h2>

  <div class="weather-search">
    <input id="city-input" type="text" placeholder="Upiši grad, npr. Split, Silba, Washington..." />
    <button id="city-search-btn">Prikaži</button>
  </div>

  <p>Učitavanje prognoze...</p>
`
document.body.appendChild(weatherBox)

let selectedPlace = 'Rijeka'
let currentSeaState = null
let currentWeatherData = null
let currentDayPhase = 'day'
let isWeatherLoading = false

function getLivePlaceTime() {
  return new Date().toLocaleTimeString('hr-HR', {
    timeZone: currentWeatherData?.timezone || 'Europe/Zagreb',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function getLivePlaceDate() {
  if (!currentWeatherData?.currentTime) {
    return new Date()
  }

  return new Date(currentWeatherData.currentTime)
}

function getDayPhase(weather) {
  const now = getLivePlaceDate()
  const sunrise = new Date(weather.sunrise)
  const sunset = new Date(weather.sunset)

  const beforeSunrise = new Date(sunrise.getTime() - 45 * 60 * 1000)
  const afterSunrise = new Date(sunrise.getTime() + 45 * 60 * 1000)

  const beforeSunset = new Date(sunset.getTime() - 60 * 60 * 1000)
  const afterSunset = new Date(sunset.getTime() + 45 * 60 * 1000)

  if (now < beforeSunrise) return 'night'
  if (now >= beforeSunrise && now <= afterSunrise) return 'sunrise'
  if (now > afterSunrise && now < beforeSunset) return 'day'
  if (now >= beforeSunset && now <= afterSunset) return 'sunset'

  return 'night'
}

function getRealSunElevation(weather) {
  const now = getLivePlaceDate()
  const sunrise = new Date(weather.sunrise)
  const sunset = new Date(weather.sunset)

  const dayLength = sunset.getTime() - sunrise.getTime()

  if (now < sunrise || now > sunset) {
    return -8
  }

  const dayProgress =
    (now.getTime() - sunrise.getTime()) / dayLength

  return Math.sin(dayProgress * Math.PI) * 45
}

function applyDayPhase(phase, weather) {
  currentDayPhase = phase

  const settings = {
    night: {
      elevation: -8,
      azimuth: 180,
      exposure: 0.55,
      turbidity: 1.4,
      rayleigh: 0.18,
      mie: 0.001,
      light: 0.12,
      moonLight: 2.2,
      ambientMoon: 0.85,
      windColor: 0x9fc7ff
    },
    sunrise: {
      elevation: 5,
      azimuth: 115,
      exposure: 0.78,
      turbidity: 9,
      rayleigh: 1.8,
      mie: 0.006,
      light: 1.2,
      moonLight: 0,
      ambientMoon: 0,
      windColor: 0xffb36b
    },
    day: {
      elevation: 22,
      azimuth: 180,
      exposure: 1.08,
      turbidity: 6,
      rayleigh: 1.8,
      mie: 0.004,
      light: 2,
      moonLight: 0,
      ambientMoon: 0,
      windColor: 0x73d8ff
    },
    sunset: {
      elevation: 4,
      azimuth: 245,
      exposure: 0.65,
      turbidity: 10,
      rayleigh: 2.6,
      mie: 0.008,
      light: 1,
      moonLight: 0.15,
      ambientMoon: 0.08,
      windColor: 0xff8a4c
    }
  }

  const s = settings[phase] || settings.day

  renderer.toneMappingExposure = s.exposure

  sky.material.uniforms.turbidity.value = s.turbidity
  sky.material.uniforms.rayleigh.value = s.rayleigh
  sky.material.uniforms.mieCoefficient.value = s.mie

  const realElevation = weather ? getRealSunElevation(weather) : s.elevation
  setSunPosition(realElevation, s.azimuth)

  directionalLight.intensity = s.light
  moonLight.intensity = s.moonLight
  ambientNightLight.intensity = s.ambientMoon
  moonFillLight.intensity = phase === 'night' ? 0.55 : 0

  windGroup.children.forEach((line) => {
    line.material.color.setHex(s.windColor)
  })

  if (phase === 'night') {
    nightGroup.visible = true
    moon.visible = true
    moonGlow.visible = true
    moonHalo.visible = true
    stars.visible = true
    starMaterial.opacity = 0.95
    moonGlow.material.opacity = 0.22
    moonHalo.material.opacity = 0.08
  } else {
    nightGroup.visible = false
    moon.visible = false
    moonGlow.visible = false
    moonHalo.visible = false
    stars.visible = false
    starMaterial.opacity = 0
    moonGlow.material.opacity = 0
    moonHalo.material.opacity = 0
    moonFillLight.intensity = 0
  }
}

function getPhaseLabel(phase) {
  if (phase === 'night') return 'Noć'
  if (phase === 'sunrise') return 'Izlazak sunca'
  if (phase === 'day') return 'Dan'
  if (phase === 'sunset') return 'Sumrak / zalazak'
  return phase
}

function formatTime(value) {
  if (!value) return '-'

  return new Date(value).toLocaleTimeString('hr-HR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function setupSearchEvents() {
  const cityInput = document.querySelector('#city-input')
  const citySearchBtn = document.querySelector('#city-search-btn')

  if (!cityInput || !citySearchBtn) return

  citySearchBtn.addEventListener('click', () => {
    const value = cityInput.value.trim()

    if (!value || isWeatherLoading) return

    selectedPlace = value
    loadWeatherAndApplyWaves()
  })

  cityInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return

    const value = cityInput.value.trim()

    if (!value || isWeatherLoading) return

    selectedPlace = value
    loadWeatherAndApplyWaves()
  })
}

function updateWeatherBox(html, options = {}) {
  const { loading = false } = options

  weatherBox.classList.add('is-changing')

  setTimeout(() => {
    weatherBox.innerHTML = html
    setupSearchEvents()

    weatherBox.classList.toggle('is-loading', loading)

    requestAnimationFrame(() => {
      weatherBox.classList.remove('is-changing')
    })
  }, 220)
}

function getLoadingPanelHtml(place) {
  return `
    <h2>Weather & Waves</h2>

    <div class="weather-search">
      <input id="city-input" type="text" placeholder="Upiši grad, npr. Split, Silba, Washington..." value="${place}" />
      <button id="city-search-btn">Prikaži</button>
    </div>

    <div class="panel-loading-content">
      <div class="loading-orb"></div>
      <p>Učitavanje prognoze za <strong>${place}</strong>...</p>
    </div>
  `
}

function getWeatherPanelHtml(weather, seaState, dayPhase) {
  return `
    <h2>${weather.place}, ${weather.country}</h2>

    <div class="weather-search">
      <input id="city-input" type="text" placeholder="Upiši grad, npr. Split, Silba, Washington..." value="${weather.place}" />
      <button id="city-search-btn">Prikaži</button>
    </div>

    <div class="weather-row">
      <span>Trenutno vrijeme</span>
      <strong id="live-time">${getLivePlaceTime()}</strong>
    </div>

    <div class="weather-row">
      <span>Geografska širina</span>
      <strong>${weather.latitude.toFixed(4)}°</strong>
    </div>

    <div class="weather-row">
      <span>Geografska dužina</span>
      <strong>${weather.longitude.toFixed(4)}°</strong>
    </div>

    <div class="weather-row">
      <span>Temperatura</span>
      <strong>${weather.temperature} °C</strong>
    </div>

    <div class="weather-row">
      <span>Brzina vjetra</span>
      <strong>${weather.windSpeed} km/h</strong>
    </div>

    <div class="weather-row">
      <span>Smjer vjetra</span>
      <strong>${weather.windDirection}° - ${weather.windDirectionName}</strong>
    </div>

    <div class="weather-row">
      <span>Stvarna visina valova</span>
      <strong>${weather.waveHeight !== null ? `${Number(weather.waveHeight).toFixed(1)} m` : 'Nema marine podataka'}</strong>
    </div>

    <div class="weather-row">
      <span>Smjer valova</span>
      <strong>${weather.waveDirection !== null ? `${weather.waveDirection}° - ${weather.waveDirectionName}` : '-'}</strong>
    </div>

    <div class="weather-row">
      <span>Period valova</span>
      <strong>${weather.wavePeriod !== null ? `${Number(weather.wavePeriod).toFixed(1)} s` : '-'}</strong>
    </div>

    <div class="compass-wrap">
      <div class="compass-title">Kompas vjetra</div>

      <div class="compass">
        <div class="compass-ring"></div>

        <span class="compass-label compass-n">S</span>
        <span class="compass-label compass-e">I</span>
        <span class="compass-label compass-s">J</span>
        <span class="compass-label compass-w">Z</span>

        <span class="compass-label compass-ne">SI</span>
        <span class="compass-label compass-se">JI</span>
        <span class="compass-label compass-sw">JZ</span>
        <span class="compass-label compass-nw">SZ</span>

        <div class="compass-needle" style="transform: translate(-50%, -50%) rotate(${weather.windDirection + 180}deg);">
          <div class="needle-head"></div>
          <div class="needle-tail"></div>
        </div>

        <div class="compass-center"></div>
      </div>
    </div>

    <div class="weather-row">
      <span>Doba dana</span>
      <strong id="day-phase-label">${getPhaseLabel(dayPhase)}</strong>
    </div>

    <div class="weather-row">
      <span>Izlazak</span>
      <strong>${formatTime(weather.sunrise)}</strong>
    </div>

    <div class="weather-row">
      <span>Zalazak</span>
      <strong>${formatTime(weather.sunset)}</strong>
    </div>

    <div class="sea-state ${seaState.className}">
      <div class="wave-icon">🌊</div>
      <div>
        <h3>${seaState.label}</h3>
        <p>${seaState.description}</p>
      </div>
    </div>

    <div class="bar">
      <div style="width:${seaState.intensity * 100}%"></div>
    </div>

    <div class="weather-row">
      <span>Prikazana visina valova</span>
      <strong>${seaState.visibleWaveHeight} m</strong>
    </div>

    <div class="weather-row">
      <span>Reakcija mora</span>
      <strong>${Math.round(seaState.intensity * 100)}%</strong>
    </div>
  `
}

function getErrorPanelHtml(message) {
  return `
    <h2>Weather & Waves</h2>

    <div class="weather-search">
      <input id="city-input" type="text" placeholder="Upiši grad, npr. Split, Silba, Washington..." value="${selectedPlace}" />
      <button id="city-search-btn">Prikaži</button>
    </div>

    <p>${message || 'Nije moguće dohvatiti prognozu.'}</p>
  `
}

async function loadWeatherAndApplyWaves() {
  if (isWeatherLoading) return

  isWeatherLoading = true
  updateWeatherBox(getLoadingPanelHtml(selectedPlace), { loading: true })

  try {
    const weather = await getCurrentWeather(selectedPlace)
    currentWeatherData = weather

    selectedPlace = weather.place

    const seaState = mapWindToSeaState(
      weather.windSpeed,
      weather.waveHeight
    )

    const dayPhase = getDayPhase(weather)

    applyDayPhase(dayPhase, weather)
    document.body.dataset.phase = dayPhase

    seaState.windDirection = weather.windDirection
    currentSeaState = seaState

    applySeaStateToWater(water, seaState, scene)
    updateWindDirection(weather.windDirection)

    setTimeout(() => {
      updateWeatherBox(getWeatherPanelHtml(weather, seaState, dayPhase))
    }, 260)
  } catch (error) {
    console.error(error)

    setTimeout(() => {
      updateWeatherBox(getErrorPanelHtml(error.message))
    }, 260)
  } finally {
    setTimeout(() => {
      weatherBox.classList.remove('is-loading')
      isWeatherLoading = false
    }, 520)
  }
}

function updateWindDirection(directionDeg) {
  const rad = THREE.MathUtils.degToRad(directionDeg)
  windGroup.rotation.y = -rad
}

function updateLiveTimeAndPhase() {
  const liveTime = document.querySelector('#live-time')

  if (liveTime) {
    liveTime.textContent = getLivePlaceTime()
  }

  if (!currentWeatherData) return

  const newPhase = getDayPhase(currentWeatherData)

  if (newPhase !== currentDayPhase) {
    applyDayPhase(newPhase, currentWeatherData)
    document.body.dataset.phase = newPhase

    const phaseLabel = document.querySelector('#day-phase-label')

    if (phaseLabel) {
      phaseLabel.textContent = getPhaseLabel(newPhase)
    }
  }
}

loadWeatherAndApplyWaves()

setInterval(loadWeatherAndApplyWaves, 10 * 60 * 1000)
setInterval(updateLiveTimeAndPhase, 1000)

let lastTime = performance.now()

function animateWater(delta) {
  const speed =
    currentSeaState?.waveAnimationSpeed ||
    water.userData.waveAnimationSpeed ||
    water.userData.waveSpeed ||
    0.65

  if (water.material.uniforms.time) {
    water.material.uniforms.time.value += delta * speed
  }
}

function animateWind() {
  const windSpeed = currentWeatherData?.windSpeed || 5
  const strength = currentSeaState?.intensity || 0.25
  const time = performance.now() * 0.001

  const realWindFactor = THREE.MathUtils.clamp(windSpeed / 60, 0.08, 1.8)

  windGroup.children.forEach((ribbon) => {
    ribbon.material.opacity =
      0.08 +
      strength * 0.32 +
      Math.sin(time * 2 + ribbon.userData.floatOffset) * 0.04

    ribbon.position.x += ribbon.userData.speed * realWindFactor * 24

    ribbon.position.y =
      ribbon.userData.baseY +
      Math.sin(time * 1.4 + ribbon.userData.floatOffset) * 0.45

    ribbon.scale.x =
      ribbon.userData.scaleBase +
      Math.sin(time * 1.2 + ribbon.userData.floatOffset) * 0.08

    ribbon.scale.y =
      0.85 +
      Math.sin(time * 1.8 + ribbon.userData.floatOffset) * 0.12

    if (ribbon.position.x > 55) {
      ribbon.position.x = -55
      ribbon.position.y = 3 + Math.random() * 18
      ribbon.userData.baseY = ribbon.position.y
      ribbon.position.z = (Math.random() - 0.5) * 70
    }
  })
}

function animateNightSky(delta) {
  if (!nightGroup.visible) return

  stars.rotation.y += delta * 0.01
  moon.rotation.y += delta * 0.025

  moonGlow.material.opacity =
    0.22 + Math.sin(performance.now() * 0.001) * 0.04

  moonHalo.material.opacity =
    0.07 + Math.sin(performance.now() * 0.0008) * 0.025
}

function animate() {
  requestAnimationFrame(animate)

  const now = performance.now()
  const delta = (now - lastTime) / 1000
  lastTime = now

  animateWater(delta)
  animateWind()
  animateNightSky(delta)

  controls.update()
  renderer.render(scene, camera)
}

animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})