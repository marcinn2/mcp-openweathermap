import { OpenWeatherAPI } from "openweather-api-node";
import type { SessionData } from "../auth/types.js";
import { getStdioSession } from "../auth/stdio.js";
import { parseLocation } from "./location-parser.js";
import type { Units } from "../schemas.js";

/**
 * Create an OpenWeatherAPI client for the given session
 *
 * A fresh client is returned for every request. The client holds mutable
 * per-request state (location and units), so sharing a cached instance across
 * tool calls would leak state between requests and race under HTTP transport
 * where calls run concurrently. Construction performs no network I/O, so this
 * is cheap.
 *
 * @param session - Session data from HTTP auth, or null/undefined for stdio
 * @returns Configured OpenWeatherAPI client
 */
export function getOpenWeatherClient(session: SessionData | null | undefined): OpenWeatherAPI {
  // For stdio transport, use the global session
  const effectiveSession = session || getStdioSession();

  if (!effectiveSession) {
    throw new Error("No authentication session available");
  }

  return new OpenWeatherAPI({
    key: effectiveSession.apiKey,
    // Default to metric units, can be overridden per request
    units: "metric",
  });
}

/**
 * Configure client for a specific request
 * @param client - OpenWeatherAPI client instance
 * @param location - Location string to parse
 * @param units - Temperature units
 */
export function configureClientForLocation(
  client: OpenWeatherAPI, 
  location: string, 
  units?: Units
): OpenWeatherAPI {
  // Parse location
  const parsed = parseLocation(location);
  
  // Set location based on type
  if (parsed.type === 'coordinates' && parsed.latitude && parsed.longitude) {
    client.setLocationByCoordinates(parsed.latitude, parsed.longitude);
  } else if (parsed.type === 'city' && parsed.city) {
    client.setLocationByName(parsed.city);
  } else {
    throw new Error("Invalid location format");
  }
  
  // Set units if provided
  if (units) {
    client.setUnits(units);
  }

  return client;
}