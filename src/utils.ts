/**
 * Sleep for specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safely parse JSON string, returning null on failure
 */
export function safeJsonParse(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Safely read response body as text, with size limit for security
 */
export async function safeReadBody(response: Response, maxSize = 1024): Promise<string> {
  try {
    const text = await response.text();
    if (text.length > maxSize) {
      return `[Response body truncated - ${text.length} chars]`;
    }
    return text;
  } catch {
    return "[Failed to read response body]";
  }
}
