import pino from "pino";

// URL pattern matching Discord and Slack webhooks
const WEBHOOK_URL_PATTERNS = [
  /https:\/\/discord\.com\/api\/webhooks\/[^\/\s]+\/[^\/\s]+/gi,
  /https:\/\/hooks\.slack\.com\/services\/[^\/\s]+\/[^\/\s]+\/[^\/\s]+/gi,
];

/**
 * Redact webhook URLs from any string value
 */
export function redactUrl(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  let redacted = value;
  for (const pattern of WEBHOOK_URL_PATTERNS) {
    redacted = redacted.replace(pattern, "[REDACTED_WEBHOOK_URL]");
  }
  
  return redacted;
}

/**
 * Recursively redact webhook URLs from objects
 */
function redactObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === "string") {
    return redactUrl(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(redactObject);
  }
  
  if (typeof obj === "object") {
    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      redacted[key] = redactObject(value);
    }
    return redacted;
  }
  
  return obj;
}

// Create Pino logger with redaction
const logger = pino({
  level: "info",
  redact: {
    paths: [
      // Redact common sensitive fields
      "webhook",
      "webhookUrl",
      "url",
      "DISCORD_WEBHOOK_URL", 
      "SLACK_WEBHOOK_URL",
      "*.webhook",
      "*.webhookUrl",
      "*.url",
    ],
    censor: "[REDACTED]",
  },
  serializers: {
    // Custom serializer to redact webhook URLs in any log entry
    msg: redactUrl,
    message: redactUrl,
    error: (err) => {
      if (err instanceof Error) {
        return {
          type: err.name,
          message: redactUrl(err.message),
          stack: redactUrl(err.stack),
        };
      }
      return redactObject(err);
    },
  },
  // Use a custom transform to redact the entire log object
  formatters: {
    log: (obj) => redactObject(obj),
  },
});

// Wrapper functions for safe logging
export const log = {
  info: (msg: string, obj?: any) => {
    logger.info(redactObject(obj), redactUrl(msg) as string);
  },
  
  warn: (msg: string, obj?: any) => {
    logger.warn(redactObject(obj), redactUrl(msg) as string);
  },
  
  error: (msg: string, obj?: any) => {
    logger.error(redactObject(obj), redactUrl(msg) as string);
  },
  
  debug: (msg: string, obj?: any) => {
    logger.debug(redactObject(obj), redactUrl(msg) as string);
  },
  
  // Safe logging for high-level service results without sensitive details
  serviceResult: (service: "discord" | "slack", success: boolean, httpCode?: number) => {
    logger.info(`${service} send ${success ? "succeeded" : "failed"}${httpCode ? ` (HTTP ${httpCode})` : ""}`);
  },

  // Log API errors without exposing URLs or sensitive response content
  apiError: (service: "discord" | "slack", httpCode: number, attempt: number) => {
    logger.warn(`${service} API error HTTP ${httpCode} on attempt ${attempt}`);
  },

  // Log retry attempts
  retryAttempt: (service: "discord" | "slack", attempt: number, maxRetries: number, delayMs: number) => {
    logger.info(`${service} retrying attempt ${attempt}/${maxRetries} after ${delayMs}ms`);
  },
};

export default log;
