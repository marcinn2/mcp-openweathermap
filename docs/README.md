# Deployment Examples

Reference manifests for running the OpenWeatherMap MCP Server over the
**HTTP stream transport**. All examples serve the Streamable HTTP endpoint at
`/mcp` on port `3000`, with the legacy SSE endpoint at `/sse` and a health
check at `/health`.

| File | Purpose |
|------|---------|
| [`docker-compose.yml`](./docker-compose.yml) | Single-container Docker Compose example (builds from the repo `Dockerfile`). |
| [`kubernetes/`](./kubernetes/) | Namespace, Secret, ConfigMap, Deployment, Service, and Ingress manifests. |

## Configuration

| Variable | Default | Notes |
|----------|---------|-------|
| `MCP_TRANSPORT` | `stdio` | Set to `httpStream` for these deployments. |
| `HOST` | `0.0.0.0` | Bind address. The default (all interfaces) is required for container port forwarding and Kubernetes probes — do not set this to `localhost`. |
| `PORT` | `3000` | HTTP listen port. |
| `MCP_ENDPOINT` | `/mcp` | Streamable HTTP path (`/sse` and `/health` are fixed). |
| `CORS_ORIGIN` | `*` | Comma-separated allowed origins. |
| `OPENWEATHER_API_KEY` | — | The server's upstream OpenWeatherMap credential (required). |
| `MCP_AUTH_TOKEN` | — | Access token(s) clients must send as a Bearer credential (comma-separated). Unset = open endpoint. |

### Authentication

Two separate credentials:

- `OPENWEATHER_API_KEY` is the server's upstream credential for OpenWeatherMap.
  It is always server-side and never sent by clients.
- `MCP_AUTH_TOKEN` is the access token that gates the MCP endpoint. When set,
  every request must present a matching Bearer token:

```http
Authorization: Bearer <your-mcp-access-token>
```

A missing or invalid token returns `401 Unauthorized`. Configure multiple tokens
(comma-separated) to give different clients distinct credentials. If
`MCP_AUTH_TOKEN` is unset, token auth is disabled — **always set it for a
network-exposed deployment.**

## Docker Compose

Run from the repository root (so Compose loads the root `.env`):

```bash
cp .env.example .env          # set OPENWEATHER_API_KEY and MCP_AUTH_TOKEN
docker compose -f docs/docker-compose.yml up --build
```

Verify (send the access token, not the API key):

```bash
curl http://localhost:3000/health        # -> ok
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'
```

## Kubernetes

Manifests are numbered so they apply in dependency order (namespace first):

```
kubernetes/
  00-namespace.yaml
  10-secret.yaml      # fallback API key (template)
  20-configmap.yaml
  30-deployment.yaml  # set your image here
  40-service.yaml
  50-ingress.yaml     # optional
```

Build and push an image your cluster can pull, then set the `image:` field in
`kubernetes/30-deployment.yaml`:

```bash
docker build -t ghcr.io/<owner>/mcp-openweathermap:latest .
docker push   ghcr.io/<owner>/mcp-openweathermap:latest
```

Provide the OpenWeatherMap API key and the MCP access token, then apply. Two
options:

**A. Edit the template** — put both values in `10-secret.yaml`, then apply
everything:

```bash
kubectl apply -f docs/kubernetes/
```

**B. Keep secrets out of git** — create the Secret imperatively and skip the
template (otherwise applying it would overwrite your values with placeholders):

```bash
kubectl apply -f docs/kubernetes/00-namespace.yaml
kubectl -n mcp-openweathermap create secret generic mcp-openweathermap-secret \
  --from-literal=OPENWEATHER_API_KEY=your-openweathermap-api-key \
  --from-literal=MCP_AUTH_TOKEN=your-strong-random-access-token
# Apply everything except the secret template (00 + 10 are handled above).
for f in docs/kubernetes/[2-5]*.yaml; do kubectl apply -f "$f"; done
```

> For a bearer-only deployment you can skip the Secret entirely — the env entry
> is marked `optional` in the Deployment.

Check rollout and reach the service:

```bash
kubectl -n mcp-openweathermap rollout status deploy/mcp-openweathermap
kubectl -n mcp-openweathermap port-forward svc/mcp-openweathermap 8080:80
curl http://localhost:8080/health   # -> ok
```

The included `50-ingress.yaml` (NGINX) is optional; edit the host and enable TLS
before using it externally.

### Scaling

The Streamable HTTP transport keeps per-session state **in memory**, so a client
must keep reaching the same pod. With the default `replicas: 1` this is a
non-issue. To run multiple replicas, pin clients to a pod:

- The Service sets `sessionAffinity: ClientIP`.
- For ingress, enable cookie-based affinity (annotations are included, commented,
  in `ingress.yaml`).

Without sticky sessions, a request routed to a different pod than the one that
created the session will fail.

### Security notes

- Containers run as non-root (uid/gid `10014`, matching the Dockerfile), drop all
  Linux capabilities, and disallow privilege escalation.
- `readOnlyRootFilesystem` is left `false` because Bun writes a transpile cache at
  runtime; to enable it, mount writable `emptyDir` volumes for `/tmp` and the Bun
  cache directory.
- Probes use the unauthenticated `/health` endpoint, so they work regardless of
  the API-key configuration.
