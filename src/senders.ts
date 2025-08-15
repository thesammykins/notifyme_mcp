import { type HttpResult } from "./types.js";
import { sleep, safeReadBody } from "./utils.js";
import logger from "./logger.js";

/**
 * Post JSON payload with retries and rate limiting
 */
async function postJsonWithRetries(
  url: string, 
  payload: object, 
  service: "discord" | "slack",
  maxRetries = 2
): Promise<HttpResult> {
  let attempt = 0;
  
  while (true) {
    attempt++;
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Success cases
      if (response.status === 200 || response.status === 204) {
        return {
          success: true,
          httpCode: response.status,
          timestamp: new Date().toISOString(),
        };
      }

      // Rate limiting (429) - retry with delay
      if (response.status === 429 && attempt <= maxRetries) {
        const retryAfterHeader = response.headers.get("retry-after");
        const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : 1;
        const delayMs = retryAfter * 1000;
        
        logger.retryAttempt(service, attempt, maxRetries, delayMs);
        await sleep(delayMs);
        continue;
      }

      // Other error - read body safely for context
      const errorBody = await safeReadBody(response);
      
      return {
        success: false,
        httpCode: response.status,
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      if (attempt <= maxRetries) {
        logger.retryAttempt(service, attempt, maxRetries, 1000);
        await sleep(1000);
        continue;
      }
      
      return {
        success: false,
        httpCode: 0, // Network error
        timestamp: new Date().toISOString(),
      };
    }
  }
}

/**
 * Send notification to Discord webhook
 */
export async function sendDiscord(
  webhookUrl: string, 
  payload: object, 
  maxRetries = 2
): Promise<HttpResult> {
  logger.debug("Sending Discord notification");
  
  const result = await postJsonWithRetries(webhookUrl, payload, "discord", maxRetries);
  
  logger.serviceResult("discord", result.success, result.httpCode);
  
  if (!result.success && result.httpCode > 0) {
    logger.apiError("discord", result.httpCode, maxRetries + 1);
  }
  
  return result;
}

/**
 * Send notification to Slack webhook
 */
export async function sendSlack(
  webhookUrl: string, 
  payload: object, 
  maxRetries = 2
): Promise<HttpResult> {
  logger.debug("Sending Slack notification");
  
  const result = await postJsonWithRetries(webhookUrl, payload, "slack", maxRetries);
  
  logger.serviceResult("slack", result.success, result.httpCode);
  
  if (!result.success && result.httpCode > 0) {
    logger.apiError("slack", result.httpCode, maxRetries + 1);
  }
  
  return result;
}
