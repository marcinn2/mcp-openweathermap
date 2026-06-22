// OpenWeatherMap API keys are 32-character hex strings.
const MIN_API_KEY_LENGTH = 32;

/**
 * Basic format validation for an OpenWeatherMap API key.
 * Throws if the key is obviously malformed.
 */
function validateApiKeyFormat(apiKey: string): void {
  if (apiKey.length < MIN_API_KEY_LENGTH) {
    throw new Error("Invalid OpenWeatherMap API key format. Please check your API key.");
  }
}

/**
 * Read and validate the OpenWeatherMap API key from the environment.
 * Used by the stdio transport and as the fallback for the HTTP stream transport.
 *
 * @param transportLabel - Human-readable transport name used in the error message
 * @returns The validated API key
 */
export function resolveApiKey(transportLabel: string): string {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error(
      `OPENWEATHER_API_KEY environment variable is required for ${transportLabel}. ` +
      "Please set it before starting the server."
    );
  }

  validateApiKeyFormat(apiKey);
  return apiKey;
}
