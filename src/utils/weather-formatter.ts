import type { Units } from "../schemas.js";

/**
 * Get temperature unit symbol
 */
export function getTemperatureUnit(units: Units = "metric"): string {
  switch (units) {
    case "imperial":
      return "F";
    case "standard":
      return "K";
    case "metric":
    default:
      return "C";
  }
}

/**
 * Format Unix timestamp to readable date
 */
export function formatDateTime(timestamp: number, timezone?: number): string {
  const date = new Date(timestamp * 1000);
  
  if (timezone !== undefined) {
    // Adjust for timezone offset
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const cityTime = new Date(utcTime + (timezone * 1000));
    return cityTime.toLocaleString();
  }
  
  return date.toLocaleString();
}

/**
 * Convert wind direction degrees to compass direction
 */
export function getWindDirection(degrees: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", 
                     "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round((degrees % 360) / 22.5);
  return directions[index % 16];
}

/**
 * Format weather data as structured JSON for LLM consumption
 */
export function formatCurrentWeather(data: any, units: Units = "metric"): string {
  const weatherData = {
    location: data.name || 'Unknown',
    temperature: {
      current: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      units: getTemperatureUnit(units)
    },
    conditions: data.weather[0].description,
    humidity: data.main.humidity,
    wind: {
      speed: Number(data.wind.speed.toFixed(1)),
      direction: getWindDirection(data.wind.deg),
      units: units === "imperial" ? "mph" : "m/s"
    },
    visibility: {
      value: units === "imperial" ? Number((data.visibility / 1609.34).toFixed(1)) : Number((data.visibility / 1000).toFixed(1)),
      units: units === "imperial" ? "mi" : "km"
    },
    timestamp: data.dt
  };
  
  return JSON.stringify(weatherData);
}

/**
 * Format forecast data as structured JSON for LLM consumption
 */
export function formatWeatherForecast(forecasts: any[], location: string, units: Units = "metric"): string {
  const forecastData = {
    location,
    forecasts: forecasts.map((forecast, index) => ({
      day: index + 1,
      temperature: {
        min: Math.round(forecast.main.temp_min),
        max: Math.round(forecast.main.temp_max),
        units: getTemperatureUnit(units)
      },
      conditions: forecast.weather[0].description,
      humidity: forecast.main.humidity,
      wind: {
        speed: Number(forecast.wind.speed.toFixed(1)),
        direction: getWindDirection(forecast.wind.deg),
        units: units === "imperial" ? "mph" : "m/s"
      },
      timestamp: forecast.dt
    }))
  };
  
  return JSON.stringify(forecastData);
}

/**
 * Format hourly forecast data as structured JSON for LLM consumption
 */
export function formatHourlyForecast(hourlyData: any[], location: string, units: Units = "metric"): string {
  const forecastData = {
    location,
    hourly_forecast: hourlyData.map((hour, index) => ({
      hour: index + 1,
      datetime: formatDateTime(hour.dtRaw || hour.dt),
      temperature: {
        current: Math.round(hour.weather?.temp?.cur || hour.temp),
        feels_like: Math.round(hour.weather?.feelsLike?.cur || hour.feels_like),
        units: getTemperatureUnit(units)
      },
      conditions: hour.weather?.description || hour.description,
      humidity: hour.weather?.humidity || hour.humidity,
      wind: {
        speed: Number((hour.weather?.wind?.speed || hour.wind_speed || 0).toFixed(1)),
        direction: getWindDirection(hour.weather?.wind?.deg || hour.wind_deg || 0),
        units: units === "imperial" ? "mph" : "m/s"
      },
      pressure: hour.weather?.pressure || hour.pressure,
      visibility: (hour.weather?.visibility || hour.visibility) ? {
        value: units === "imperial" ? Number(((hour.weather?.visibility || hour.visibility) / 1609.34).toFixed(1)) : Number(((hour.weather?.visibility || hour.visibility) / 1000).toFixed(1)),
        units: units === "imperial" ? "mi" : "km"
      } : null,
      uvi: hour.weather?.uvi,
      clouds: hour.weather?.clouds,
      pop: hour.weather?.pop ? Math.round(hour.weather.pop * 100) : null,
      timestamp: hour.dtRaw || hour.dt
    }))
  };
  
  return JSON.stringify(forecastData);
}