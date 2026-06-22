import type { CorsOptions } from "fastmcp";

/**
 * Build the CORS configuration for the HTTP stream transport.
 *
 * Origins are controlled by the `CORS_ORIGIN` environment variable:
 *   - unset            -> allow all origins (`*`)
 *   - comma-separated  -> allow exactly those origins
 *     (e.g. `CORS_ORIGIN=https://app.example.com,https://admin.example.com`)
 *
 * The allowed/exposed headers cover what MCP browser clients need: the
 * `Authorization` bearer header, JSON content type, the MCP session id and
 * protocol version, and the `Last-Event-ID` header used to resume SSE streams.
 */
export function getCorsOptions(): CorsOptions {
  const origins = process.env.CORS_ORIGIN
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin: origins && origins.length > 0 ? origins : "*",
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Authorization",
      "Content-Type",
      "Mcp-Session-Id",
      "Mcp-Protocol-Version",
      "Last-Event-ID",
    ],
    exposedHeaders: ["Mcp-Session-Id"],
    // Bearer auth is sent via the Authorization header, not cookies, so
    // credentialed requests are not required (and would conflict with `*`).
    credentials: false,
    maxAge: 86400,
  };
}
