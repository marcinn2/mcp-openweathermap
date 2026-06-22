# OpenWeatherMap MCP Server

A Model Context Protocol (MCP) server that provides comprehensive weather data and forecasts through the OpenWeatherMap API. This server enables AI assistants to access real-time weather information, forecasts, air quality data, and location services.

## Features

### Weather Tools
- **Current Weather** - Get current conditions for any location
- **Weather Forecast** - 5-day weather forecast with 3-hour intervals
- **Hourly Forecast** - Detailed hourly forecasts for up to 48 hours
- **Daily Forecast** - Daily weather forecasts for up to 8 days with temperature ranges and astronomical data
- **Minutely Forecast** - Minute-by-minute precipitation forecasts for the next hour
- **Weather Alerts** - Active weather warnings and alerts with severity classification

### Air Quality & Location
- **Current Air Pollution** - Real-time air quality index and pollutant measurements
- **Location Info** - Reverse geocoding to get location details from coordinates
- **OneCall Weather** - Comprehensive weather data combining multiple forecasts
- **Air Pollution** - Historical and forecast air quality data
- **Geocoding** - Convert location names to coordinates

### Server Capabilities
- **Prompts** - User-invokable templates (e.g. `weather-briefing`, `trip-planner`) that orchestrate the tools
- **Dual transport** - stdio and Streamable HTTP (plus a legacy SSE compatibility endpoint)
- **HTTP security** - Bearer access-token authentication (`MCP_AUTH_TOKEN`) and configurable CORS
- **Container-ready** - Dockerfile plus Docker Compose and Kubernetes examples in [`docs/`](docs/README.md)

## Installation

### Prerequisites
- [Bun](https://bun.sh) runtime
- OpenWeatherMap API key (free at [openweathermap.org](https://openweathermap.org/api))

### Setup

1. Clone the repository:
```bash
git clone https://github.com/marcinn2/mcp-openweathermap.git
cd mcp-openweathermap
```

2. Install dependencies:
```bash
bun install
```

3. Set up your environment variables:
```bash
cp .env.example .env
# Edit .env and add your OpenWeatherMap API key
```

Environment variables:
- `OPENWEATHER_API_KEY` - Your OpenWeatherMap API key (required for both transports; the server's upstream credential)
- `MCP_AUTH_TOKEN` - Access token(s) required as a Bearer credential for HTTP transport (comma-separated for multiple; unset = open access)
- `PORT` - Server port for HTTP transport (default: 3000)
- `MCP_TRANSPORT` - Transport type: `stdio` or `httpStream` (default: stdio)
- `HOST` - Bind address for HTTP transport (default: `0.0.0.0`, i.e. all interfaces)
- `MCP_ENDPOINT` - Streamable HTTP endpoint path (default: /mcp)
- `CORS_ORIGIN` - Comma-separated allowed origins for HTTP transport (default: `*`)

## Usage

### Running the Server

**Stdio Transport (default):**
```bash
bun run src/main.ts
```

**HTTP Stream Transport:**
```bash
MCP_TRANSPORT=httpStream PORT=3000 bun run src/main.ts
```

#### HTTP Endpoints

When running with `MCP_TRANSPORT=httpStream`, the server exposes the following
endpoints (default `PORT=3000`):

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/mcp` (configurable via `MCP_ENDPOINT`) | `GET`, `POST` | **Streamable HTTP** transport — the recommended MCP transport. `POST` sends client→server messages; `GET` opens a server→client SSE stream. Responses are streamed using `text/event-stream`. |
| `/sse` | `GET` | **Legacy HTTP+SSE** transport, auto-mounted for backward compatibility. This path is fixed and is **not** affected by `MCP_ENDPOINT`. |
| `/health` | `GET` | Health check, returns `200 OK`. |

Notes:
- Streamable HTTP and the legacy SSE transport are served simultaneously. Point
  modern clients at `/mcp` and legacy SSE clients at `/sse`.
- A `GET` to `/mcp` requires a valid `mcp-session-id` obtained from a prior
  `initialize` call; without one it returns `400`.
- `MCP_ENDPOINT` only relocates the Streamable HTTP endpoint. The `/sse` and
  `/health` paths are fixed.

### Claude Desktop Configuration

Add this configuration to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "openweathermap": {
      "command": "npx",
      "args": ["mcp-openweathermap"],
      "env": {
        "OPENWEATHER_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## API Tools

### Weather Information
- `get-current-weather` - Current weather conditions
- `get-weather-forecast` - 5-day forecast  
- `get-hourly-forecast` - Hourly forecasts (up to 48 hours)
- `get-daily-forecast` - Daily forecasts (up to 8 days)
- `get-minutely-forecast` - Minute-by-minute precipitation

### Alerts & Air Quality  
- `get-weather-alerts` - Weather warnings and alerts
- `get-current-air-pollution` - Current air quality data
- `get-air-pollution` - Air quality forecasts and history

### Location Services
- `get-location-info` - Reverse geocoding from coordinates
- `geocode-location` - Convert addresses to coordinates
- `get-onecall-weather` - Comprehensive weather data

## Prompts

In addition to tools, the server exposes user-invokable **prompts** — ready-made
templates (usually surfaced as slash commands) that combine the tools above to
answer common questions. Discover them via `prompts/list`; fetch one with
`prompts/get`.

| Prompt | Arguments | What it does |
|--------|-----------|--------------|
| `weather-briefing` | `location*`, `units` | Current conditions, the next few days, and any active alerts |
| `what-to-wear` | `location*`, `units` | Clothing recommendation from current + hourly conditions |
| `air-quality-check` | `location*` | Air quality with practical health guidance |
| `trip-planner` | `destination*`, `days`, `units` | Multi-day outlook to plan a trip |
| `severe-weather-watch` | `location*` | Alerts plus the detailed OneCall picture |

`*` = required argument. `units` accepts `metric`, `imperial`, or `standard`.

## Development

### Running in Development
```bash
bun run src/main.ts
```

### Testing with MCP Inspector
```bash
bun run inspect
```

Then connect the MCP Inspector to test the tools interactively.

### Build
```bash
bun run build
```

## Authentication

Two credentials are kept separate:

- **OpenWeatherMap API key** (`OPENWEATHER_API_KEY`) — the server's own upstream
  credential, used to call OpenWeatherMap. It is always server-side and is never
  sent by clients.
- **Access token** (`MCP_AUTH_TOKEN`) — the Bearer credential that gates access
  to the MCP server itself. It is unrelated to OpenWeatherMap.

**Stdio Transport:** Uses the `OPENWEATHER_API_KEY` environment variable. No
access token applies.

**HTTP Stream Transport:** When `MCP_AUTH_TOKEN` is set, each request must carry
a matching access token:

```http
Authorization: Bearer <your-mcp-access-token>
```

Requests with a missing or invalid token receive a `401 Unauthorized` response.
You can configure multiple tokens (comma-separated in `MCP_AUTH_TOKEN`) to give
different clients distinct credentials. If `MCP_AUTH_TOKEN` is **unset**, token
authentication is disabled and the HTTP endpoint is open — set it for any
network-exposed deployment.

### CORS

The HTTP stream transport sends CORS headers so browser-based MCP clients can
connect. By default all origins are allowed (`*`); restrict them with the
`CORS_ORIGIN` environment variable (comma-separated). The `Authorization`,
`Content-Type`, `Mcp-Session-Id`, `Mcp-Protocol-Version`, and `Last-Event-ID`
request headers are allowed, and `Mcp-Session-Id` is exposed to clients.

## Deployment

Ready-to-use deployment examples live in [`docs/`](docs/README.md):

- **Docker Compose** — [`docs/docker-compose.yml`](docs/docker-compose.yml)
- **Kubernetes** — [`docs/kubernetes/`](docs/kubernetes/) (namespace, secret, configmap, deployment, service, ingress)

### Docker

```bash
docker build -t mcp-openweathermap .
docker run --rm -p 3000:3000 \
  -e OPENWEATHER_API_KEY=your-api-key \
  -e MCP_AUTH_TOKEN=your-access-token \
  mcp-openweathermap
```

The image defaults to `MCP_TRANSPORT=httpStream`, `PORT=3000`, `MCP_ENDPOINT=/mcp`,
and binds `0.0.0.0` so it is reachable inside containers. See the
[deployment guide](docs/README.md) for Compose and Kubernetes details, including
scaling (sticky sessions) and security notes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [OpenWeatherMap API Documentation](https://openweathermap.org/api)
- [openweather-api-node Library](https://github.com/loloToster/openweather-api-node) - The underlying API client
- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Issue Tracker](https://github.com/marcinn2/mcp-openweathermap/issues)