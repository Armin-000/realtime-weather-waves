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
    : 'No marine data available'

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

export const searchBar = (value = '') => `
  <div class="weather-search">
    <input
      id="city-input"
      type="text"
      placeholder="Enter city, e.g. Split, Silba, Washington..."
      value="${escapeHtml(value)}"
    />
    <button id="city-search-btn">Show</button>
  </div>`

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

// ─── Main panel builder ───────────────────────────────────────────────────────
export function buildWeatherPanel(
  weather: WeatherPanelData,
  sea: SeaPanelData,
  phase: DayPhase,
  getLocalTimeStr: () => string
) {
  return `
    ${searchBar(weather.place)}
    ${row('Local time', `<span id="live-time">${getLocalTimeStr()}</span>`)}
    ${row('Latitude', `${weather.latitude.toFixed(4)}°`)}
    ${row('Longitude', `${weather.longitude.toFixed(4)}°`)}
    ${row('Temperature', `${weather.temperature} °C`)}
    ${row('Wind speed', `${weather.windSpeed} km/h`)}
    ${row('Wind direction', `${weather.windDirection}° - ${weather.windDirectionName}`)}
    ${row('Wave height', marine(weather.waveHeight, 'm'))}
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

    <div class="compass-wrap">
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
    </div>

    ${row('Day phase', `<span id="day-phase-label">${PHASE_LABELS[phase]}</span>`)}
    ${row('Sunrise', fmtTime(weather.sunrise))}
    ${row('Sunset', fmtTime(weather.sunset))}

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

    ${row('Displayed wave height', `${sea.visibleWaveHeight} m`)}
    ${row('Ocean response', `${Math.round(sea.intensity * 100)}%`)}`
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