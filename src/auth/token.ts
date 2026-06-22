import { timingSafeEqual } from "node:crypto";

/**
 * MCP access tokens — the Bearer credential that gates access to the HTTP stream
 * transport. This is separate from the OpenWeatherMap API key (which is the
 * server's own upstream credential, read from OPENWEATHER_API_KEY).
 *
 * Configure one or more tokens via the `MCP_AUTH_TOKEN` environment variable
 * (comma-separated for multiple clients). When unset, token authentication is
 * disabled and the HTTP endpoint is open.
 */
export function getConfiguredTokens(): string[] {
  return (process.env.MCP_AUTH_TOKEN ?? "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

/**
 * Whether Bearer-token authentication is enabled (i.e. MCP_AUTH_TOKEN is set).
 */
export function isAuthEnabled(): boolean {
  return getConfiguredTokens().length > 0;
}

/**
 * Constant-time string comparison to avoid leaking token contents via timing.
 */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  // timingSafeEqual requires equal-length buffers.
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Check a presented token against the configured access tokens.
 */
export function isValidToken(token: string): boolean {
  return getConfiguredTokens().some((configured) => safeEqual(configured, token));
}
