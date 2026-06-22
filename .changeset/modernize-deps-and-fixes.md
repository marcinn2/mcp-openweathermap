---
"mcp-openweathermap": minor
---

Modernize dependencies and fix request-isolation/consistency issues.

- Upgrade `fastmcp` 2 → 4 and `zod` 3 → 4 (and align dev deps).
- Add Bearer access-token auth for the HTTP stream transport via `MCP_AUTH_TOKEN` (separate from the OpenWeatherMap API key; comma-separated for multiple clients, constant-time compared). Missing/invalid tokens return 401; unset disables token auth. The OpenWeatherMap API key is now always server-side (`OPENWEATHER_API_KEY`).
- Add configurable CORS for the HTTP stream transport (`CORS_ORIGIN`, defaults to `*`).
- Add five example MCP prompts (`weather-briefing`, `what-to-wear`, `air-quality-check`, `trip-planner`, `severe-weather-watch`) that orchestrate the tools.
- Bind the HTTP stream transport to `0.0.0.0` by default (configurable via `HOST`); FastMCP's `localhost` default is loopback-only and breaks container port forwarding and Kubernetes probes.
- Add deployment examples under `docs/` (Docker Compose and Kubernetes manifests).
- Create a fresh OpenWeatherMap client per request so location/units state no longer leaks between concurrent tool calls.
- Honor the `exclude` parameter on `get-onecall-weather` (previously accepted but ignored).
- Apply `MCP_ENDPOINT` to the HTTP stream server (previously only logged).
- Fix the hourly-forecast location label fallback when coordinates are unavailable.
- Read the server version from `package.json` at runtime instead of hard-coding it.
- Switch TypeScript to NodeNext module resolution; remove dead schemas/formatters and duplicated API-key validation.
- Update docs to reflect that the HTTP transport authenticates via `OPENWEATHER_API_KEY` (no bearer token).
