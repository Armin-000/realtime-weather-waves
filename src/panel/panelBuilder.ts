// ─── panelBuilder.ts ─────────────────────────────────────────────────────────

export type DayPhase = 'night' | 'sunrise' | 'day' | 'sunset'

export type WeatherPanelData = {
  place: string
  latitude: number
  longitude: number
  temperature: number
  windSpeed: number
  windDirection: number
  windDirectionName: string

  waveHeight: number | null
  waveDirection: number | null
  waveDirectionName: string
  wavePeriod: number | null

  sunrise: string
  sunset: string
}

export type SeaPanelData = {
  label: string
  description: string
  className: string
  intensity: number
  visibleWaveHeight: number
}

export const PHASE_LABELS: Record<DayPhase, string> = {
  night: 'Night',
  sunrise: 'Sunrise',
  day: 'Day',
  sunset: 'Sunset'
}

// ─── Small helpers ────────────────────────────────────────────────────────────
const row = (label: string, value: string) =>
  `<div class="weather-row"><span>${label}</span><strong>${value}</strong></div>`

const fmtTime = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-'

const marine = (value: number | null | undefined, unit: string) =>
  value !== null && value !== undefined
    ? `${Number(value).toFixed(1)} ${unit}`
    : 'No marine data'

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

// ─── Search ───────────────────────────────────────────────────────────────────
export const searchBar = (value = '') => `
  <div class="weather-search-wrap">
    <div class="weather-search">
      <input
        id="city-input"
        type="text"
        placeholder="Enter city..."
        value="${escapeHtml(value)}"
        autocomplete="off"
      />
      <button id="city-search-btn">Show</button>
    </div>

    <div id="city-suggestions" class="city-suggestions"></div>
  </div>`

// ─── Loading / Error panels ──────────────────────────────────────────────────
export const buildLoadingPanel = (selectedPlace: string) => `
  <h2>Weather & Waves</h2>
  ${searchBar(selectedPlace)}
  <div class="panel-loading-content">
    <div class="loading-orb"></div>
    <p>Loading forecast for <strong>${escapeHtml(selectedPlace)}</strong>...</p>
  </div>`

export const buildErrorPanel = (selectedPlace: string, message?: string) => `
  <h2>Weather & Waves</h2>
  ${searchBar(selectedPlace)}
  <p>${escapeHtml(message || 'Unable to load weather forecast.')}</p>`

// ─── Floating Compass HUD ─────────────────────────────────────────────────────
export function buildCompassHud(weather: WeatherPanelData) {
  return `
    <div class="compass-title">Wind Compass</div>

    <div class="compass">
      <div class="compass-ring"></div>

      <span class="compass-label compass-n">N</span>
      <span class="compass-label compass-e">E</span>
      <span class="compass-label compass-s">S</span>
      <span class="compass-label compass-w">W</span>
      <span class="compass-label compass-ne">NE</span>
      <span class="compass-label compass-se">SE</span>
      <span class="compass-label compass-sw">SW</span>
      <span class="compass-label compass-nw">NW</span>

      <div
        class="compass-needle"
        style="transform:translate(-50%,-50%) rotate(${weather.windDirection + 180}deg)"
      >
        <div class="needle-head"></div>
        <div class="needle-tail"></div>
      </div>

      <div class="compass-center"></div>
    </div>

    <div class="compass-meta">
      ${weather.windDirection}° · ${escapeHtml(weather.windDirectionName)}
    </div>
  `
}

// ─── Main panel builder ───────────────────────────────────────────────────────
export function buildWeatherPanel(
  weather: WeatherPanelData,
  sea: SeaPanelData,
  phase: DayPhase,
  getLocalTimeStr: () => string
) {
  return `
    ${searchBar(weather.place)}

    <div class="compact-weather-card">
      <div class="compact-location">
        <span class="compact-kicker">Current location</span>
        <h2>${escapeHtml(weather.place)}</h2>
      </div>

      <div class="compact-temperature">
        ${weather.temperature}<span>°C</span>
      </div>
    </div>

    <div class="compact-grid">
      <div class="compact-stat">
        <span>Wind</span>
        <strong>${weather.windSpeed} km/h</strong>
      </div>

      <div class="compact-stat">
        <span>Wave</span>
        <strong>${marine(weather.waveHeight, 'm')}</strong>
      </div>

      <div class="compact-stat">
        <span>Phase</span>
        <strong id="day-phase-label">${PHASE_LABELS[phase]}</strong>
      </div>

      <div class="compact-stat">
        <span>Ocean</span>
        <strong>${Math.round(sea.intensity * 100)}%</strong>
      </div>
    </div>

    <div class="sea-state ${sea.className}">
      <div class="wave-icon">🌊</div>
      <div>
        <h3>${escapeHtml(sea.label)}</h3>
        <p>${escapeHtml(sea.description)}</p>
      </div>
    </div>

    <div class="bar">
      <div style="width:${sea.intensity * 100}%"></div>
    </div>

    <button id="details-toggle" class="details-toggle" type="button">
      <span>Details</span>
      <strong>+</strong>
    </button>

    <div id="weather-details" class="weather-details">
      ${row('Local time', `<span id="live-time">${getLocalTimeStr()}</span>`)}
      ${row('Wind direction', `${weather.windDirection}° - ${weather.windDirectionName}`)}
      ${row(
        'Wave direction',
        weather.waveDirection !== null
          ? `${weather.waveDirection}° - ${weather.waveDirectionName}`
          : '-'
      )}
      ${row(
        'Wave period',
        weather.wavePeriod !== null
          ? `${Number(weather.wavePeriod).toFixed(1)} s`
          : '-'
      )}
      ${row('Sunrise', fmtTime(weather.sunrise))}
      ${row('Sunset', fmtTime(weather.sunset))}
      ${row('Displayed wave height', `${sea.visibleWaveHeight} m`)}
      ${row('Latitude', `${weather.latitude.toFixed(4)}°`)}
      ${row('Longitude', `${weather.longitude.toFixed(4)}°`)}
    </div>
  `
}

// ─── Panel DOM controls ───────────────────────────────────────────────────────
export function setPanel(
  weatherBox: HTMLElement,
  panelContent: HTMLElement,
  html: string,
  loading = false,
  onComplete: (() => void) | null = null
) {
  weatherBox.classList.add('is-changing')

  setTimeout(() => {
    panelContent.innerHTML = html

    weatherBox.classList.toggle('is-loading', loading)
    panelContent.classList.toggle('is-loading', loading)

    if (onComplete) onComplete()

    requestAnimationFrame(() => {
      weatherBox.classList.remove('is-changing')
    })
  }, 220)
}

export function bindSearch(onSearch: (value: string) => void) {
  const input = document.querySelector<HTMLInputElement>('#city-input')
  const button = document.querySelector<HTMLButtonElement>('#city-search-btn')

  if (!input || !button) return

  const go = () => {
    const value = input.value.trim()

    if (value) {
      onSearch(value)
    }
  }

  button.addEventListener('click', go)

  input.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      go()
    }
  })
}