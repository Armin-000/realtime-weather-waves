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

export const degreesToCompass = deg => {
  const n = Number(deg)
  if (deg == null || Number.isNaN(n)) return '-'

  return COMPASS[Math.round((((n % 360) + 360) % 360) / 45) % 8]
}

const rainyWeatherCodes = new Set([
  51, 53, 55,
  56, 57,
  61, 63, 65,
  66, 67,
  80, 81, 82,
  95, 96, 99
])

const geocodeCache = new Map()

export function getPrecipitationIntensity({ precipitation = 0, rain = 0, showers = 0, weatherCode = null }) {
  const amount =
    Number(precipitation || 0) +
    Number(rain || 0) +
    Number(showers || 0)

  const hasRainCode = rainyWeatherCodes.has(Number(weatherCode))

  if (amount <= 0 && !hasRainCode) return 0

  if (amount < 0.3) return 0.2
  if (amount < 1.0) return 0.4
  if (amount < 2.5) return 0.65
  if (amount < 5.0) return 0.85

  return 1
}

export async function searchPlaces(query, signal) {
  const value = query.trim()

  if (value.length < 1) return []

  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&count=6&language=en&format=json`,
    { signal }
  )

  if (!res.ok) throw new Error('Location suggestions failed.')

  const data = await res.json()

  return (data.results || []).map(place => ({
    id: place.id,
    name: place.name,
    country: place.country,
    admin1: place.admin1 || '',
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone
  }))
}

export async function geocodePlace(query) {
  const cacheKey = query.trim().toLocaleLowerCase()
  const cached = geocodeCache.get(cacheKey)

  if (cached) return cached

  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
  )

  if (!res.ok) throw new Error('City search failed.')

  const data = await res.json()

  if (!data.results?.length) {
    throw new Error(`City "${query}" was not found.`)
  }

  const { name, country, latitude, longitude, timezone } = data.results[0]
  const place = {
    name,
    country,
    latitude,
    longitude,
    timezone
  }

  geocodeCache.set(cacheKey, place)

  return place
}

async function getMarineData(latitude, longitude) {
  try {
    const res = await fetch(
      `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}` +
      `&current=wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,wind_wave_period,swell_wave_height,swell_wave_direction,swell_wave_period&timezone=auto`
    )

    if (!res.ok) return null

    const data = await res.json()

    return data.current ?? null
  } catch (err) {
    console.warn('Marine API is not available:', err)
    return null
  }
}

export async function getCurrentWeather(query = 'Rijeka') {
  const place = await geocodePlace(query)

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&current=temperature_2m,wind_speed_10m,wind_direction_10m,is_day,weather_code,precipitation,rain,showers,cloud_cover` +
    `&daily=sunrise,sunset&wind_speed_unit=kmh&timezone=auto`

  const [res, marine] = await Promise.all([
    fetch(forecastUrl),
    getMarineData(place.latitude, place.longitude)
  ])

  if (!res.ok) {
    throw new Error(`Error fetching weather forecast: ${res.status}`)
  }

  const data = await res.json()

  if (!data.current || !data.daily) {
    throw new Error('API did not return expected data.')
  }

  const cur = data.current

  const waveKey = key => marine?.[key] ?? null
  const waveCmp = key => degreesToCompass(marine?.[key])

  const precipitation = Number(cur.precipitation ?? 0)
  const rain = Number(cur.rain ?? 0)
  const showers = Number(cur.showers ?? 0)
  const weatherCode = cur.weather_code

  const precipitationTotal = precipitation + rain + showers

  const precipitationIntensity = getPrecipitationIntensity({
    precipitation,
    rain,
    showers,
    weatherCode
  })

  const isRaining =
    precipitationIntensity > 0 ||
    rainyWeatherCodes.has(Number(weatherCode))

  return {
    place: place.name,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: data.timezone,

    temperature: Math.round(cur.temperature_2m),
    windSpeed: Math.round(cur.wind_speed_10m),
    windDirection: Math.round(cur.wind_direction_10m),
    windDirectionName: degreesToCompass(cur.wind_direction_10m),
    weatherCode,
    isDay: cur.is_day === 1,
    currentTime: cur.time,
    sunrise: data.daily.sunrise?.[0],
    sunset: data.daily.sunset?.[0],

    precipitation,
    rain,
    showers,
    precipitationTotal,
    precipitationIntensity,
    isRaining,
    cloudCover: Number(cur.cloud_cover ?? 0),

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