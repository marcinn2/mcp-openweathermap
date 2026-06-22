# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development and testing
bun run dev                 # Run development server with .env file
bun run test               # Run test suite
bun run test:watch         # Run tests in watch mode
bun run typecheck          # TypeScript type checking
bun run typecheck:watch    # Type checking in watch mode

# Build and release
bun run build             # Compile TypeScript to JavaScript
bun run release           # Build and publish (with changesets)

# MCP Inspector for testing
bun run inspect           # Test with MCP Inspector (dev)
bun run inspect:built     # Test with MCP Inspector (built)
bun run inspect:http      # Test with MCP Inspector (HTTP mode)
```

## Architecture Overview

This is an MCP (Model Context Protocol) server that provides weather data integration through OpenWeatherMap API. It implements 11 weather-related tools using the FastMCP framework.

### Core Components

- **Main Entry Point** (`src/main.ts`): Implements all 11 weather tools with FastMCP framework
- **Authentication System** (`src/auth/`): Handles both HTTP bearer token and stdio environment variable authentication
- **Schema Validation** (`src/schemas.ts`): Zod schemas for all 11 tools with comprehensive input validation
- **Transport Configuration** (`src/config/transport.ts`): Environment-driven transport selection (stdio/HTTP stream)

### Key Utilities

- **Client Resolver** (`src/utils/client-resolver.ts`): Manages OpenWeatherAPI client instances with session-based caching
- **Location Parser** (`src/utils/location-parser.ts`): Parses coordinates, city names, and various location formats
- **Weather Formatter** (`src/utils/weather-formatter.ts`): Formats API responses for display

### Transport Modes

The server supports dual transport modes:
- **Stdio Transport** (default): Uses `OPENWEATHER_API_KEY` environment variable
- **HTTP Stream Transport**: Two separate credentials. The **access token** (`MCP_AUTH_TOKEN`, verified in `src/auth/token.ts`) gates client access via `Authorization: Bearer <token>` — a missing/invalid token yields 401, and an unset `MCP_AUTH_TOKEN` disables token auth (open endpoint). The **OpenWeatherMap API key** (`OPENWEATHER_API_KEY`) is always server-side and used for upstream calls. CORS is configured in `src/config/cors.ts` (origins via `CORS_ORIGIN`, default `*`).

Transport selection is automatic based on environment detection in `src/config/transport.ts`.

In `httpStream` mode the server exposes three endpoints (via FastMCP/mcp-proxy):
- `MCP_ENDPOINT` (default `/mcp`) — Streamable HTTP transport (`GET`/`POST`, SSE-streamed responses)
- `/sse` — legacy HTTP+SSE transport, auto-mounted at a fixed path (not affected by `MCP_ENDPOINT`)
- `/health` — health check

`MCP_ENDPOINT` only relocates the Streamable HTTP endpoint; `/sse` and `/health` are fixed. The bind address comes from `HOST` (default `0.0.0.0`); FastMCP itself defaults to loopback-only `localhost`, which would break container port forwarding and Kubernetes probes, so the default is overridden in `src/config/transport.ts`.

### Capabilities (tools, resources, prompts)

The server registers all three MCP primitives in `src/main.ts`:
- **11 tools** covering current conditions, forecasts (hourly/daily/minutely), air quality, weather alerts, and location services. All tools use consistent error handling. A fresh `OpenWeatherAPI` client is created per request (in `src/utils/client-resolver.ts`) to avoid leaking location/units state between concurrent calls.
- **1 resource** (`openweather://api/docs`) with server documentation.
- **5 prompts** (user-invokable templates) that orchestrate the tools: `weather-briefing`, `what-to-wear`, `air-quality-check`, `trip-planner`, `severe-weather-watch`. Each `addPrompt.load` returns instruction text; they call tools, they do not fetch data themselves.

## Development Notes

- Built with Bun runtime and TypeScript (ES2022 target, NodeNext modules)
- Uses `openweather-api-node` for OpenWeatherMap API integration (imported as a named export for NodeNext compatibility)
- MCP Inspector configurations available for all transport modes
- Comprehensive error handling with context-aware messages

## Version Management

The FastMCP server version is read from `package.json` at runtime
(`src/main.ts`), so it stays in sync automatically. Changesets bumps
`package.json` on release — no manual edits to `src/main.ts` are needed.