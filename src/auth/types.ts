/**
 * Session data structure for authenticated requests.
 *
 * `apiKey` is the OpenWeatherMap API key the server uses for upstream calls
 * (always sourced from `OPENWEATHER_API_KEY`). The client's access token, when
 * required, is verified during authentication and is not stored here.
 *
 * Declared as a type alias (not an interface) so it satisfies FastMCP's
 * `FastMCPSessionAuth` constraint (`Record<string, unknown>`).
 */
export type SessionData = {
  apiKey: string;
  authenticatedAt: Date;
};

/**
 * Authentication result structure
 */
export interface AuthResult {
  success: boolean;
  session?: SessionData;
  error?: string;
}