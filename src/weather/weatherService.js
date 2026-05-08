export function degreesToCompass(deg) {
  if (deg === null || deg === undefined || Number.isNaN(Number(deg))) return '-'

  const directions = [
    'Sjever',
    'Sjeveroistok',
    'Istok',
    'Jugoistok',
    'Jug',
    'Jugozapad',
    'Zapad',
    'Sjeverozapad'
  ]

  const normalizedDeg = ((Number(deg) % 360) + 360) % 360
  const index = Math.round(normalizedDeg / 45) % 8

  return directions[index]
}

export async function geocodePlace(query) {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(query)}` +
    `&count=1` +
    `&language=hr` +
    `&format=json`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Greška kod pretraživanja grada.')
  }

  const data = await response.json()

  if (!data.results || data.results.length === 0) {
    throw new Error(`Grad "${query}" nije pronađen.`)
  }

  const place = data.results[0]

  return {
    name: place.name,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone
  }
}

async function getMarineData(latitude, longitude) {
  const marineUrl =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&current=wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,wind_wave_period,swell_wave_height,swell_wave_direction,swell_wave_period` +
    `&timezone=auto`

  try {
    const response = await fetch(marineUrl)

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (!data.current) {
      return null
    }

    return data.current
  } catch (error) {
    console.warn('Marine API nije dostupan:', error)
    return null
  }
}

export async function getCurrentWeather(query = 'Rijeka') {
  const place = await geocodePlace(query)

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${place.latitude}` +
    `&longitude=${place.longitude}` +
    `&current=temperature_2m,wind_speed_10m,wind_direction_10m,is_day,weather_code` +
    `&daily=sunrise,sunset` +
    `&wind_speed_unit=kmh` +
    `&timezone=auto`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Greška kod dohvaćanja prognoze: ${response.status}`)
  }

  const data = await response.json()

  if (!data.current || !data.daily) {
    throw new Error('API nije vratio očekivane podatke.')
  }

  const marine = await getMarineData(place.latitude, place.longitude)

  return {
    place: place.name,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: data.timezone,

    temperature: Math.round(data.current.temperature_2m),
    windSpeed: Math.round(data.current.wind_speed_10m),
    windDirection: Math.round(data.current.wind_direction_10m),
    windDirectionName: degreesToCompass(data.current.wind_direction_10m),

    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,

    currentTime: data.current.time,
    sunrise: data.daily.sunrise?.[0],
    sunset: data.daily.sunset?.[0],

    waveHeight: marine?.wave_height ?? null,
    waveDirection: marine?.wave_direction ?? null,
    waveDirectionName: degreesToCompass(marine?.wave_direction),
    wavePeriod: marine?.wave_period ?? null,

    windWaveHeight: marine?.wind_wave_height ?? null,
    windWaveDirection: marine?.wind_wave_direction ?? null,
    windWaveDirectionName: degreesToCompass(marine?.wind_wave_direction),
    windWavePeriod: marine?.wind_wave_period ?? null,

    swellWaveHeight: marine?.swell_wave_height ?? null,
    swellWaveDirection: marine?.swell_wave_direction ?? null,
    swellWaveDirectionName: degreesToCompass(marine?.swell_wave_direction),
    swellWavePeriod: marine?.swell_wave_period ?? null,

    hasMarineData: marine !== null
  }
}