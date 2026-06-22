# Use the official Bun image as the base image
FROM oven/bun:1 AS base

# Set working directory
WORKDIR /app

# Copy package.json and bun.lock (if exists) for dependency installation
COPY package.json bun.lock* ./

# Install dependencies as root first
RUN bun install --frozen-lockfile

# Create a non-root user and change ownership
RUN groupadd -g 10014 appgroup && \
    useradd -u 10014 -g appgroup appuser && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER 10014

# Copy source code
COPY . .

ENV MCP_TRANSPORT=httpStream
ENV PORT=3000
ENV MCP_ENDPOINT=/mcp

# Expose port for the HTTP stream transport
EXPOSE 3000

# Bun executes the TypeScript entry point directly (no separate build step needed)
CMD ["bun", "run", "src/main.ts"]
