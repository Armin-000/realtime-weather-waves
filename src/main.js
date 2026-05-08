import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import { getCurrentWeather } from './weather/weatherService.js'
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

const waterGeometry = new THREE.PlaneGeometry(10000, 10000)

const textureLoader = new THREE.TextureLoader()

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
  fog: false
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

function updateEnvironment() {
  const renderTarget = pmremGenerator.fromScene(sky)
  scene.environment = renderTarget.texture
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
  <p>Učitavanje prognoze...</p>
`
document.body.appendChild(weatherBox)

let currentSeaState = null
let currentWeatherData = null
let currentDayPhase = 'day'

function getLiveRijekaTime() {
  return new Date().toLocaleTimeString('hr-HR', {
    timeZone: 'Europe/Zagreb',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function getLiveRijekaDate() {
  return new Date()
}

function getDayPhase(weather) {
  const now = getLiveRijekaDate()
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
  const now = getLiveRijekaDate()
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
      waterColor: 0x00203a,
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
      waterColor: 0x12384a,
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
      waterColor: 0x00324d,
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
      waterColor: 0x102638,
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

  if (water.material.uniforms.waterColor) {
    water.material.uniforms.waterColor.value.setHex(s.waterColor)
  }

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
    scene.fog = new THREE.FogExp2(0x020817, 0.005)
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

    scene.fog = phase === 'sunrise' || phase === 'sunset'
      ? new THREE.FogExp2(0x33251f, 0.004)
      : null
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

async function loadWeatherAndApplyWaves() {
  try {
    const weather = await getCurrentWeather('rijeka')
    currentWeatherData = weather

    const seaState = mapWindToSeaState(weather.windSpeed)
    const dayPhase = getDayPhase(weather)

    applyDayPhase(dayPhase, weather)
    document.body.dataset.phase = dayPhase

    seaState.windDirection = weather.windDirection
    currentSeaState = seaState

    applySeaStateToWater(water, seaState)
    updateWaterFromSeaState(seaState)
    updateWindDirection(weather.windDirection)

    weatherBox.innerHTML = `
      <h2>${weather.place}</h2>

      <div class="weather-row">
        <span>Trenutno vrijeme</span>
        <strong id="live-time">${getLiveRijekaTime()}</strong>
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
        <strong>${weather.windDirection}°</strong>
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
        <span>Visina valova</span>
        <strong>${seaState.visibleWaveHeight} m</strong>
      </div>

      <div class="weather-row">
        <span>Reakcija mora</span>
        <strong>${Math.round(seaState.intensity * 100)}%</strong>
      </div>
    `
  } catch (error) {
    console.error(error)

    weatherBox.innerHTML = `
      <h2>Weather & Waves</h2>
      <p>Nije moguće dohvatiti prognozu.</p>
    `
  }
}

function updateWaterFromSeaState(seaState) {
  if (water.material.uniforms.distortionScale) {
    water.material.uniforms.distortionScale.value =
      2.2 + seaState.choppiness * 4.5
  }

  if (water.material.uniforms.size) {
    water.material.uniforms.size.value =
      0.8 + seaState.intensity * 2.5
  }
}

function updateWindDirection(directionDeg) {
  const rad = THREE.MathUtils.degToRad(directionDeg)
  windGroup.rotation.y = -rad
}

function updateLiveTimeAndPhase() {
  const liveTime = document.querySelector('#live-time')

  if (liveTime) {
    liveTime.textContent = getLiveRijekaTime()
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
  const speed = water.userData.waveSpeed || 0.65

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
      0.08 + strength * 0.32 + Math.sin(time * 2 + ribbon.userData.floatOffset) * 0.04

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