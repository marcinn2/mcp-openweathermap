import { z } from "zod";

/**
 * Common Schemas
 */

// Temperature units schema
export const unitsSchema = z.enum(["metric", "imperial", "standard"]).optional()
  .describe("Temperature units: metric (Celsius), imperial (Fahrenheit), or standard (Kelvin)");

/**
 * Weather Operation Schemas
 */

// Get current weather parameters
export const getCurrentWeatherSchema = z.object({
  location: z.string().describe("City name (e.g., 'New York') or coordinates (e.g., 'lat,lon')"),
  units: unitsSchema,
});

// Get weather forecast parameters
export const getWeatherForecastSchema = z.object({
  location: z.string().describe("City name (e.g., 'New York') or coordinates (e.g., 'lat,lon')"),
  units: unitsSchema,
  days: z.number().min(1).max(5).optional().describe("Number of days to forecast (1-5, default: 5)"),
});

// Get hourly forecast parameters
export const getHourlyForecastSchema = z.object({
  location: z.string().describe("City name (e.g., 'New York') or coordinates (e.g., 'lat,lon')"),
  units: unitsSchema,
  hours: z.number().min(1).max(48).optional().describe("Number of hours to forecast (1-48, default: 48)"),
});

// Get daily forecast parameters
export const getDailyForecastSchema = z.object({
  location: z.string().describe("City name (e.g., 'New York') or coordinates (e.g., 'lat,lon')"),
  units: unitsSchema,
  days: z.number().min(1).max(8).optional().describe("Number of days to forecast (1-8, default: 8)"),
  include_today: z.boolean().optional().describe("Include today's forecast (default: false)"),
});

// Get minutely forecast parameters
export const getMinutelyForecastSchema = z.object({
  location: z.string().describe("City name (e.g., 'New York') or coordinates (e.g., 'lat,lon')"),
  limit: z.number().min(1).max(60).optional().describe("Number of minutes to forecast (1-60, default: 60)"),
});

// Get weather alerts parameters  
export const getWeatherAlertsSchema = z.object({
  location: z.string().describe("City name (e.g., 'New York') or coordinates (e.g., 'lat,lon')"),
});

// Get current air pollution parameters (location-based)
export const getCurrentAirPollutionSchema = z.object({
  location: z.string().describe("City name (e.g., 'New York') or coordinates (e.g., 'lat,lon')"),
});

// Get location info parameters (reverse geocoding)
export const getLocationInfoSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Latitude coordinate"),
  longitude: z.number().min(-180).max(180).describe("Longitude coordinate"),
});

// OneCall exclude options
export const oneCallExcludeSchema = z.array(
  z.enum(["current", "minutely", "hourly", "daily", "alerts"])
).optional().describe("Parts of weather data to exclude from the response");

// Get OneCall weather parameters
export const getOneCallWeatherSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Latitude coordinate"),
  longitude: z.number().min(-180).max(180).describe("Longitude coordinate"),
  units: unitsSchema,
  exclude: oneCallExcludeSchema,
});

/**
 * Air Quality Operation Schemas
 */

// Get air pollution parameters
export const getAirPollutionSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Latitude coordinate"),
  longitude: z.number().min(-180).max(180).describe("Longitude coordinate"),
});

/**
 * Geocoding Operation Schemas
 */

// Geocode location parameters
export const geocodeLocationSchema = z.object({
  query: z.string().describe("Location name, zip code, or address to geocode"),
  limit: z.number().min(1).max(10).optional().describe("Maximum number of results to return (default: 5)"),
});

/**
 * Type Exports (for use in tools)
 */
export type Units = z.infer<typeof unitsSchema>;
export type OneCallExclude = z.infer<typeof oneCallExcludeSchema>;

export type GetCurrentWeatherInput = z.infer<typeof getCurrentWeatherSchema>;
export type GetWeatherForecastInput = z.infer<typeof getWeatherForecastSchema>;
export type GetHourlyForecastInput = z.infer<typeof getHourlyForecastSchema>;
export type GetDailyForecastInput = z.infer<typeof getDailyForecastSchema>;
export type GetMinutelyForecastInput = z.infer<typeof getMinutelyForecastSchema>;
export type GetWeatherAlertsInput = z.infer<typeof getWeatherAlertsSchema>;
export type GetCurrentAirPollutionInput = z.infer<typeof getCurrentAirPollutionSchema>;
export type GetLocationInfoInput = z.infer<typeof getLocationInfoSchema>;
export type GetOneCallWeatherInput = z.infer<typeof getOneCallWeatherSchema>;
export type GetAirPollutionInput = z.infer<typeof getAirPollutionSchema>;
export type GeocodeLocationInput = z.infer<typeof geocodeLocationSchema>;