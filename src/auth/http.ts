import type { IncomingMessage } from "node:http";
import type { SessionData } from "./types.js";
import { resolveApiKey } from "./api-key.js";
import { isAuthEnabled, isValidToken } from "./token.js";

/**
 * Extract a Bearer token from a request's Authorization header.
 * Returns undefined when the header is missing or not a Bearer credential.
 */
function extractBearerToken(request: IncomingMessage): string | undefined {
  const headerValue = request.headers.authorization;
  const header = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (!header) {
    return undefined;
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return undefined;
  }

  return token.trim();
}

/**
 * HTTP Stream authenticator for FastMCP.
 *
 * Authentication is session-based and uses TWO independent credentials:
 *
 *   1. Access token (client -> server): when `MCP_AUTH_TOKEN` is configured,
 *      each request must present a matching `Authorization: Bearer <token>`.
 *      This token gates access to the MCP server and is unrelated to weather.
 *      When `MCP_AUTH_TOKEN` is unset, token auth is disabled (open endpoint).
 *
 *   2. OpenWeatherMap API key (server -> OpenWeatherMap): always read from the
 *      `OPENWEATHER_API_KEY` environment variable and shared across sessions.
 *
 * A missing/invalid access token is rejected, which FastMCP/mcp-proxy surfaces
 * as a 401 Unauthorized response.
 */
export async function httpStreamAuthenticator(
  request: IncomingMessage
): Promise<SessionData> {
  // 1. Verify the MCP access token when one is configured.
  if (isAuthEnabled()) {
    const token = extractBearerToken(request);

    if (!token) {
      throw new Error(
        "Missing access token. Provide it as 'Authorization: Bearer <token>'."
      );
    }

    if (!isValidToken(token)) {
      throw new Error("Invalid access token.");
    }
  }

  // 2. The OpenWeatherMap API key is server-side configuration.
  const apiKey = resolveApiKey("HTTP stream transport");

  return {
    apiKey,
    authenticatedAt: new Date(),
  };
}
