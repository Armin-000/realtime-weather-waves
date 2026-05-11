const COMPASS = [
  'North',
  'Northeast',
  'East',
  'Southeast',
  'South',
  'Southwest',
  'West',
  'Northwest'
]

export const degreesToCompass = (deg: number | null | undefined): string => {
  const n = Number(deg)
  if (deg == null || Number.isNaN(n)) return '-'

  return COMPASS[Math.round((((n % 360) + 360) % 360) / 45) % 8]
}

const safeRound = (value: unknown): number | null => {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n) : null
}

export async function geocodePlace(query: string) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
  )

  if (!res.ok) throw new Error('City search failed.')

  const data = await res.json()

  if (!data.results?.length) {
    throw new Error(`City "${query}" was not found.`)
  }

  const { name, country, latitude, longitude, timezone } = data.results[0]

  return {
    name,
    country,
    latitude,
    longitude,
    timezone
  }
}

async function getMarineData(latitude: number, longitude: number) {
  try {
    const res = await fetch(
      `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}` +
        `&current=wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,wind_wave_period,swell_wave_height,swell_wave_direction,swell_wave_period` +
        `&timezone=auto&forecast_days=1`
    )

    if (!res.ok) {
      console.warn('Marine API returned status:', res.status)
      return null
    }

    const data = await res.json()
    return data.current ?? null
  } catch (err) {
    console.warn('Marine API is not available:', err)
    return null
  }
}

export async function getCurrentWeather(query = 'Rijeka') {
  const place = await geocodePlace(query)

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
      `&current=temperature_2m,wind_speed_10m,wind_direction_10m,is_day,weather_code` +
      `&daily=sunrise,sunset` +
      `&wind_speed_unit=kmh&timezone=auto&forecast_days=1`
  )

  if (!res.ok) {
    throw new Error(`Error fetching weather forecast: ${res.status}`)
  }

  const data = await res.json()

  if (!data.current || !data.daily) {
    throw new Error('API did not return expected data.')
  }

  const marine = await getMarineData(place.latitude, place.longitude)
  const cur = data.current

  const waveKey = (key: string) => marine?.[key] ?? null
  const waveCmp = (key: string) => degreesToCompass(marine?.[key])

  return {
    place: place.name,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: data.timezone ?? place.timezone,

    temperature: safeRound(cur.temperature_2m),
    windSpeed: safeRound(cur.wind_speed_10m),
    windDirection: safeRound(cur.wind_direction_10m),
    windDirectionName: degreesToCompass(cur.wind_direction_10m),
    weatherCode: cur.weather_code ?? null,
    isDay: cur.is_day === 1,
    currentTime: cur.time ?? null,
    sunrise: data.daily.sunrise?.[0] ?? null,
    sunset: data.daily.sunset?.[0] ?? null,

    waveHeight: waveKey('wave_height'),
    waveDirection: waveKey('wave_direction'),
    waveDirectionName: waveCmp('wave_direction'),
    wavePeriod: waveKey('wave_period'),

    windWaveHeight: waveKey('wind_wave_height'),
    windWaveDirection: waveKey('wind_wave_direction'),
    windWaveDirectionName: waveCmp('wind_wave_direction'),
    windWavePeriod: waveKey('wind_wave_period'),

    swellWaveHeight: waveKey('swell_wave_height'),
    swellWaveDirection: waveKey('swell_wave_direction'),
    swellWaveDirectionName: waveCmp('swell_wave_direction'),
    swellWavePeriod: waveKey('swell_wave_period'),

    hasMarineData: marine !== null
  }
}