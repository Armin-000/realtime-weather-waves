import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import { getCurrentWeather } from './weather/weatherService.js'
import { mapWindToSeaState, applySeaStateToWater } from './water/weatherWaves.js'
import './style.css'

// ─── Renderer / Scene / Camera ───────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
Object.assign(renderer, { toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 })
document.querySelector('#app').appendChild(renderer.domElement)

const scene  = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 20000)
camera.position.set(0, 8, 28)

const controls = new OrbitControls(camera, renderer.domElement)
Object.assign(controls, { enableDamping: true, minDistance: 8, maxDistance: 120, maxPolarAngle: Math.PI * 0.48 })
controls.target.set(0, 0, 0)
controls.update()

// ─── Sky & Water ─────────────────────────────────────────────────────────────
const sky = new Sky()
sky.scale.setScalar(10000)
scene.add(sky)
const su = sky.material.uniforms
su.turbidity.value = 6; su.rayleigh.value = 1.8; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.78

const loader      = new THREE.TextureLoader()
const waterNormals = loader.load('https://threejs.org/examples/textures/waternormals.jpg',
  t => { t.wrapS = t.wrapT = THREE.RepeatWrapping })

const water = new Water(new THREE.PlaneGeometry(10000, 10000), {
  textureWidth: 1024, textureHeight: 1024, waterNormals,
  sunDirection: new THREE.Vector3(), sunColor: 0xffffff,
  waterColor: 0x00324d, distortionScale: 3.7, fog: true
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
  sun.setFromSphericalCoords(1,
    THREE.MathUtils.degToRad(90 - elevation),
    THREE.MathUtils.degToRad(azimuth))
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

const glowMesh = (radius, color, opacity) => new THREE.Mesh(
  new THREE.SphereGeometry(radius, 64, 64),
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })
)

const starPos = new Float32Array(900 * 3)
for (let i = 0; i < 900; i++) {
  starPos[i*3]   = (Math.random() - 0.5) * 700
  starPos[i*3+1] = 35 + Math.random() * 240
  starPos[i*3+2] = -100 - Math.random() * 550
}
const starGeo = new THREE.BufferGeometry()
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.25, transparent: true, opacity: 0 })
const stars   = new THREE.Points(starGeo, starMat)
nightGroup.add(stars)
nightGroup.visible = false

// ─── Wind ribbons ─────────────────────────────────────────────────────────────
const windGroup = new THREE.Group()
scene.add(windGroup)

function createWindTexture() {
  const c = Object.assign(document.createElement('canvas'), { width: 512, height: 64 })
  const ctx = c.getContext('2d')
  const g   = ctx.createLinearGradient(0, 0, 512, 0)
  ;[[0,'rgba(255,255,255,0)'],[0.18,'rgba(255,255,255,0.18)'],[0.5,'rgba(255,255,255,0.75)'],
    [0.82,'rgba(255,255,255,0.18)'],[1,'rgba(255,255,255,0)']].forEach(([s, c]) => g.addColorStop(s, c))
  ctx.fillStyle = g
  for (let i = 0; i < 7; i++) {
    ctx.beginPath()
    ctx.ellipse(256, 16 + Math.random() * 32, 230, 1.2 + Math.random() * 2.5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  return new THREE.CanvasTexture(c)
}

const windTex = createWindTexture()
for (let i = 0; i < 55; i++) {
  const mesh  = new THREE.Mesh(
    new THREE.PlaneGeometry(9 + Math.random() * 16, 0.45 + Math.random() * 1.1),
    new THREE.MeshBasicMaterial({ map: windTex, color: 0x9fc7ff, transparent: true,
      opacity: 0.38, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  )
  const baseY = 3 + Math.random() * 18
  mesh.position.set((Math.random() - 0.5) * 95, baseY, (Math.random() - 0.5) * 70)
  mesh.rotation.set(0, Math.random() * 0.35, (Math.random() - 0.5) * 0.08)
  mesh.userData = { speed: 0.05 + Math.random() * 0.12, floatOffset: Math.random() * Math.PI * 2,
    baseY, scaleBase: 0.75 + Math.random() * 0.8 }
  windGroup.add(mesh)
}

// ─── Phase config ─────────────────────────────────────────────────────────────
const PHASES = {
  night:   { el:-8,  az:180, exp:0.55, turb:1.4,  ray:0.18, mie:0.001, lit:0.12, ml:2.2,  am:0.85, wc:0x9fc7ff },
  sunrise: { el:5,   az:115, exp:0.78, turb:9,    ray:1.8,  mie:0.006, lit:1.2,  ml:0,    am:0,    wc:0xffb36b },
  day:     { el:22,  az:180, exp:1.08, turb:6,    ray:1.8,  mie:0.004, lit:2,    ml:0,    am:0,    wc:0x73d8ff },
  sunset:  { el:4,   az:245, exp:0.65, turb:10,   ray:2.6,  mie:0.008, lit:1,    ml:0.15, am:0.08, wc:0xff8a4c }
}
const PHASE_LABELS = { night:'Noć', sunrise:'Izlazak sunca', day:'Dan', sunset:'Sumrak / zalazak' }

// ─── State ────────────────────────────────────────────────────────────────────
let currentDayPhase    = 'day'
let currentWeatherData = null
let currentSeaState    = null
let isWeatherLoading   = false
let selectedPlace      = 'Rijeka'

// ─── Time helpers ─────────────────────────────────────────────────────────────
const getLocalDate    = () => currentWeatherData?.currentTime ? new Date(currentWeatherData.currentTime) : new Date()
const getLocalTimeStr = () => new Date().toLocaleTimeString('hr-HR',
  { timeZone: currentWeatherData?.timezone || 'Europe/Zagreb', hour:'2-digit', minute:'2-digit', second:'2-digit' })

function getDayPhase(w) {
  const now  = getLocalDate()
  const rise = new Date(w.sunrise)
  const set  = new Date(w.sunset)
  if (now < new Date(+rise - 45 * 60000)) return 'night'
  if (now <= new Date(+rise + 45 * 60000)) return 'sunrise'
  if (now < new Date(+set  - 60 * 60000)) return 'day'
  if (now <= new Date(+set  + 45 * 60000)) return 'sunset'
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
  su.turbidity.value = s.turb; su.rayleigh.value = s.ray; su.mieCoefficient.value = s.mie
  updateSun(weather ? getSunElevation(weather) : s.el, s.az)
  dirLight.intensity = s.lit; moonLight.intensity = s.ml
  ambientNight.intensity = s.am; moonFill.intensity = phase === 'night' ? 0.55 : 0
  windGroup.children.forEach(r => r.material.color.setHex(s.wc))
  const isNight = phase === 'night'
  nightGroup.visible = isNight
  starMat.opacity            = isNight ? 0.95 : 0
}

// ─── UI / Panel ───────────────────────────────────────────────────────────────
const weatherBox = document.createElement('div')
weatherBox.className = 'weather-box'

const panelHeader = document.createElement('button')
panelHeader.className = 'weather-panel-header'
panelHeader.innerHTML = `
  <span>Weather & Waves</span>
`

const panelContent = document.createElement('div')
panelContent.className = 'weather-panel-content'

weatherBox.appendChild(panelHeader)
weatherBox.appendChild(panelContent)
document.body.appendChild(weatherBox)

panelHeader.addEventListener('click', () => {
  weatherBox.classList.toggle('is-collapsed')
})

const row        = (label, val)  => `<div class="weather-row"><span>${label}</span><strong>${val}</strong></div>`
const fmtTime    = v             => v ? new Date(v).toLocaleTimeString('hr-HR', { hour:'2-digit', minute:'2-digit' }) : '-'
const searchBar  = (val = '')    => `
  <div class="weather-search">
    <input id="city-input" type="text" placeholder="Upiši grad, npr. Split, Silba, Washington..." value="${val}" />
    <button id="city-search-btn">Prikaži</button>
  </div>`

function buildWeatherPanel(w, sea, phase) {
  const marine = (v, u) => v !== null ? `${Number(v).toFixed(1)} ${u}` : 'Nema marine podataka'
  return `
    ${searchBar(w.place)}
    ${row('Trenutno vrijeme',    `<span id="live-time">${getLocalTimeStr()}</span>`)}
    ${row('Geografska širina',   `${w.latitude.toFixed(4)}°`)}
    ${row('Geografska dužina',   `${w.longitude.toFixed(4)}°`)}
    ${row('Temperatura',         `${w.temperature} °C`)}
    ${row('Brzina vjetra',       `${w.windSpeed} km/h`)}
    ${row('Smjer vjetra',        `${w.windDirection}° - ${w.windDirectionName}`)}
    ${row('Stvarna visina valova', marine(w.waveHeight, 'm'))}
    ${row('Smjer valova',        w.waveDirection !== null ? `${w.waveDirection}° - ${w.waveDirectionName}` : '-')}
    ${row('Period valova',       w.wavePeriod    !== null ? `${Number(w.wavePeriod).toFixed(1)} s` : '-')}
    <div class="compass-wrap">
      <div class="compass-title">Kompas vjetra</div>
      <div class="compass">
        <div class="compass-ring"></div>
        <span class="compass-label compass-n">S</span><span class="compass-label compass-e">I</span>
        <span class="compass-label compass-s">J</span><span class="compass-label compass-w">Z</span>
        <span class="compass-label compass-ne">SI</span><span class="compass-label compass-se">JI</span>
        <span class="compass-label compass-sw">JZ</span><span class="compass-label compass-nw">SZ</span>
        <div class="compass-needle" style="transform:translate(-50%,-50%) rotate(${w.windDirection + 180}deg)">
          <div class="needle-head"></div><div class="needle-tail"></div>
        </div>
        <div class="compass-center"></div>
      </div>
    </div>
    ${row('Doba dana',  `<span id="day-phase-label">${PHASE_LABELS[phase]}</span>`)}
    ${row('Izlazak',    fmtTime(w.sunrise))}
    ${row('Zalazak',    fmtTime(w.sunset))}
    <div class="sea-state ${sea.className}">
      <div class="wave-icon">🌊</div>
      <div><h3>${sea.label}</h3><p>${sea.description}</p></div>
    </div>
    <div class="bar"><div style="width:${sea.intensity * 100}%"></div></div>
    ${row('Prikazana visina valova', `${sea.visibleWaveHeight} m`)}
    ${row('Reakcija mora',           `${Math.round(sea.intensity * 100)}%`)}`
}

function setPanel(html, loading = false) {
  weatherBox.classList.add('is-changing')
  setTimeout(() => {
    panelContent.innerHTML = html
    weatherBox.classList.toggle('is-loading', loading)
    panelContent.classList.toggle('is-loading', loading)
    bindSearch()
    requestAnimationFrame(() => weatherBox.classList.remove('is-changing'))
  }, 220)
}

function bindSearch() {
  const input = document.querySelector('#city-input')
  const btn   = document.querySelector('#city-search-btn')
  if (!input || !btn) return
  const go = () => { const v = input.value.trim(); if (v && !isWeatherLoading) { selectedPlace = v; loadWeather() } }
  btn.addEventListener('click', go)
  input.addEventListener('keydown', e => e.key === 'Enter' && go())
}

// ─── Weather fetch ────────────────────────────────────────────────────────────
async function loadWeather() {
  if (isWeatherLoading) return
  isWeatherLoading = true
  setPanel(`<h2>Weather & Waves</h2>${searchBar(selectedPlace)}
    <div class="panel-loading-content">
      <div class="loading-orb"></div>
      <p>Učitavanje prognoze za <strong>${selectedPlace}</strong>...</p>
    </div>`, true)

  try {
    const weather  = await getCurrentWeather(selectedPlace)
    currentWeatherData = weather
    selectedPlace  = weather.place
    const seaState = mapWindToSeaState(weather.windSpeed, weather.waveHeight)
    const phase    = getDayPhase(weather)
    seaState.windDirection = weather.windDirection
    currentSeaState = seaState
    applyDayPhase(phase, weather)
    document.body.dataset.phase = phase
    applySeaStateToWater(water, seaState, scene)
    windGroup.rotation.y = -THREE.MathUtils.degToRad(weather.windDirection)
    setTimeout(() => setPanel(buildWeatherPanel(weather, seaState, phase)), 260)
  } catch (err) {
    console.error(err)
    setTimeout(() => setPanel(`<h2>Weather & Waves</h2>${searchBar(selectedPlace)}<p>${err.message || 'Nije moguće dohvatiti prognozu.'}</p>`), 260)
  } finally {
    setTimeout(() => { weatherBox.classList.remove('is-loading'); isWeatherLoading = false }, 520)
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
    water.material.uniforms.time.value += delta * (currentSeaState?.waveAnimationSpeed ?? water.userData.waveSpeed)
  }

  // Wind
  const strength   = currentSeaState?.intensity ?? 0.25
  const windFactor = THREE.MathUtils.clamp((currentWeatherData?.windSpeed ?? 5) / 60, 0.08, 1.8)
  windGroup.children.forEach(r => {
    const { floatOffset: fo, baseY, scaleBase, speed } = r.userData
    r.material.opacity = 0.08 + strength * 0.32 + Math.sin(t * 2 + fo) * 0.04
    r.position.x += speed * windFactor * 24
    r.position.y  = baseY + Math.sin(t * 1.4 + fo) * 0.45
    r.scale.set(scaleBase + Math.sin(t * 1.2 + fo) * 0.08, 0.85 + Math.sin(t * 1.8 + fo) * 0.12, 1)
    if (r.position.x > 55) {
      r.position.x = -55
      r.position.y = r.userData.baseY = 3 + Math.random() * 18
      r.position.z = (Math.random() - 0.5) * 70
    }
  })

  // Night sky
  if (nightGroup.visible) {
    stars.rotation.y    += delta * 0.01
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