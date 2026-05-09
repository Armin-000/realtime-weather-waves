// ─── panelBuilder.js ─────────────────────────────────────────────────────────

export const PHASE_LABELS = {
  night:   'Night',
  sunrise: 'Sunrise',
  day:     'Day',
  sunset:  'Sunset'
}

// ─── Small helpers ────────────────────────────────────────────────────────────
const row     = (label, val) => `<div class="weather-row"><span>${label}</span><strong>${val}</strong></div>`
const fmtTime = v            => v ? new Date(v).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'
const marine  = (v, u)       => v !== null ? `${Number(v).toFixed(1)} ${u}` : 'No marine data available'

export const searchBar = (val = '') => `
  <div class="weather-search">
    <input id="city-input" type="text" placeholder="Enter city, e.g. Split, Silba, Washington..." value="${val}" />
    <button id="city-search-btn">Show</button>
  </div>`

export const buildLoadingPanel = selectedPlace => `
  <h2>Weather & Waves</h2>
  ${searchBar(selectedPlace)}
  <div class="panel-loading-content">
    <div class="loading-orb"></div>
    <p>Loading forecast for <strong>${selectedPlace}</strong>...</p>
  </div>`

export const buildErrorPanel = (selectedPlace, message) => `
  <h2>Weather & Waves</h2>
  ${searchBar(selectedPlace)}
  <p>${message || 'Unable to load weather forecast.'}</p>`

// ─── Main panel builder ───────────────────────────────────────────────────────
export function buildWeatherPanel(w, sea, phase, getLocalTimeStr) {
  return `
    ${searchBar(w.place)}
    ${row('Local time',       `<span id="live-time">${getLocalTimeStr()}</span>`)}
    ${row('Latitude',         `${w.latitude.toFixed(4)}°`)}
    ${row('Longitude',        `${w.longitude.toFixed(4)}°`)}
    ${row('Temperature',      `${w.temperature} °C`)}
    ${row('Wind speed',       `${w.windSpeed} km/h`)}
    ${row('Wind direction',   `${w.windDirection}° - ${w.windDirectionName}`)}
    ${row('Wave height',      marine(w.waveHeight, 'm'))}
    ${row('Wave direction',   w.waveDirection !== null ? `${w.waveDirection}° - ${w.waveDirectionName}` : '-')}
    ${row('Wave period',      w.wavePeriod    !== null ? `${Number(w.wavePeriod).toFixed(1)} s` : '-')}

    <div class="compass-wrap">
      <div class="compass-title">Wind Compass</div>
      <div class="compass">
        <div class="compass-ring"></div>
        <span class="compass-label compass-n">N</span><span class="compass-label compass-e">E</span>
        <span class="compass-label compass-s">S</span><span class="compass-label compass-w">W</span>
        <span class="compass-label compass-ne">NE</span><span class="compass-label compass-se">SE</span>
        <span class="compass-label compass-sw">SW</span><span class="compass-label compass-nw">NW</span>

        <div class="compass-needle" style="transform:translate(-50%,-50%) rotate(${w.windDirection + 180}deg)">
          <div class="needle-head"></div><div class="needle-tail"></div>
        </div>

        <div class="compass-center"></div>
      </div>
    </div>

    ${row('Day phase', `<span id="day-phase-label">${PHASE_LABELS[phase]}</span>`)}
    ${row('Sunrise',   fmtTime(w.sunrise))}
    ${row('Sunset',    fmtTime(w.sunset))}

    <div class="sea-state ${sea.className}">
      <div class="wave-icon">🌊</div>
      <div><h3>${sea.label}</h3><p>${sea.description}</p></div>
    </div>

    <div class="bar"><div style="width:${sea.intensity * 100}%"></div></div>

    ${row('Displayed wave height', `${sea.visibleWaveHeight} m`)}
    ${row('Ocean response',        `${Math.round(sea.intensity * 100)}%`)}`
}

// ─── Panel DOM controls ───────────────────────────────────────────────────────
export function setPanel(weatherBox, panelContent, html, loading = false, onComplete = null) {
  weatherBox.classList.add('is-changing')

  setTimeout(() => {
    panelContent.innerHTML = html
    weatherBox.classList.toggle('is-loading', loading)
    panelContent.classList.toggle('is-loading', loading)

    if (onComplete) onComplete()

    requestAnimationFrame(() => weatherBox.classList.remove('is-changing'))
  }, 220)
}

export function bindSearch(onSearch) {
  const input = document.querySelector('#city-input')
  const btn   = document.querySelector('#city-search-btn')

  if (!input || !btn) return

  const go = () => {
    const v = input.value.trim()
    if (v) onSearch(v)
  }

  btn.addEventListener('click', go)
  input.addEventListener('keydown', e => e.key === 'Enter' && go())
}