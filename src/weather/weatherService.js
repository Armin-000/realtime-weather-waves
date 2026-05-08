const PLACES = {
  rijeka: {
    name: 'Rijeka',
    latitude: 45.3271,
    longitude: 14.4422
  },
  zagreb: {
    name: 'Zagreb',
    latitude: 45.815,
    longitude: 15.9819
  },
  split: {
    name: 'Split',
    latitude: 43.5081,
    longitude: 16.4402
  }
}

export async function getCurrentWeather(placeKey = 'rijeka') {
  const place = PLACES[placeKey] || PLACES.rijeka

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${place.latitude}` +
    `&longitude=${place.longitude}` +
    `&current=temperature_2m,wind_speed_10m,wind_direction_10m,is_day` +
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

  return {
    place: place.name,
    latitude: place.latitude,
    longitude: place.longitude,

    temperature: data.current.temperature_2m,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    isDay: data.current.is_day === 1,

    currentTime: data.current.time,
    sunrise: data.daily.sunrise?.[0],
    sunset: data.daily.sunset?.[0],
    timezone: data.timezone
  }
}