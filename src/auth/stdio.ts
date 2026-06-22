import type { SessionData } from "./types.js";
import { resolveApiKey } from "./api-key.js";

// Global session data for stdio transport
let stdioSession: SessionData | null = null;

/**
 * Initialize authentication for stdio transport using environment variables
 * This is called once at server startup
 */
export async function initializeStdioAuth(): Promise<void> {
  const apiKey = resolveApiKey("stdio transport");

  // Store session data
  stdioSession = {
    apiKey,
    authenticatedAt: new Date(),
  };
}

/**
 * Get the current stdio session
 */
export function getStdioSession(): SessionData | null {
  return stdioSession;
}

/**
 * Clear the stdio session (for testing purposes)
 */
export function clearStdioSession(): void {
  stdioSession = null;
}