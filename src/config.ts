import { config } from "dotenv";
import { existsSync } from "fs";
import { join, resolve } from "path";
import { type Config, type Service } from "./types.js";
import logger from "./logger.js";

let cachedConfig: Config | null = null;

/**
 * Load environment variables from custom .env location if specified
 */
function loadEnvironment(): void {
  const envFile = process.env.NOTIFY_ME_ENV_FILE;
  const envDir = process.env.NOTIFY_ME_ENV_DIR;

  if (envFile) {
    // Load from specific file path
    const resolvedPath = resolve(envFile);
    if (existsSync(resolvedPath)) {
      config({ path: resolvedPath });
      logger.debug("Loaded environment from custom file", { path: resolvedPath });
    } else {
      logger.warn("Custom env file not found", { path: resolvedPath });
    }
  } else if (envDir) {
    // Load from directory
    const envPath = join(resolve(envDir), ".env");
    if (existsSync(envPath)) {
      config({ path: envPath });
      logger.debug("Loaded environment from custom directory", { path: envPath });
    } else {
      logger.warn("Custom env directory .env not found", { path: envPath });
    }
  } else {
    // Default: load from project root
    config();
    logger.debug("Loaded environment from default location");
  }
}

/**
 * Determine the auto-default service based on configured webhook URLs
 */
function determineAutoDefault(discordUrl?: string, slackUrl?: string): Service {
  if (discordUrl && !slackUrl) {
    return "discord";
  } else if (!discordUrl && slackUrl) {
    return "slack";  
  } else if (discordUrl && slackUrl) {
    // Both configured - default to Discord for backward compatibility
    return "discord";
  } else {
    throw new Error("No webhook URLs configured. Set DISCORD_WEBHOOK_URL and/or SLACK_WEBHOOK_URL in environment or .env file");
  }
}

/**
 * Get configuration with webhook URLs and auto-detected default service
 */
export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Load environment variables
  loadEnvironment();

  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

  // Validate webhook URLs if present
  if (discordWebhookUrl && !discordWebhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    throw new Error("Invalid DISCORD_WEBHOOK_URL format. Must start with https://discord.com/api/webhooks/");
  }

  if (slackWebhookUrl && !slackWebhookUrl.startsWith("https://hooks.slack.com/services/")) {
    throw new Error("Invalid SLACK_WEBHOOK_URL format. Must start with https://hooks.slack.com/services/");
  }

  const autoDefault = determineAutoDefault(discordWebhookUrl, slackWebhookUrl);

  cachedConfig = {
    discordWebhookUrl,
    slackWebhookUrl,
    autoDefault,
  };

  logger.info("Configuration loaded", {
    discordConfigured: !!discordWebhookUrl,
    slackConfigured: !!slackWebhookUrl,
    autoDefault,
  });

  return cachedConfig;
}

/**
 * Detect target services based on explicit service parameter or auto-detection
 */
export function detectService(explicitService?: Service): ("discord" | "slack")[] {
  const config = getConfig();

  if (explicitService) {
    if (explicitService === "both") {
      const services: ("discord" | "slack")[] = [];
      if (config.discordWebhookUrl) services.push("discord");
      if (config.slackWebhookUrl) services.push("slack");
      
      if (services.length === 0) {
        throw new Error("No webhook URLs configured for 'both' service option");
      }
      
      return services;
    } else if (explicitService === "discord") {
      if (!config.discordWebhookUrl) {
        throw new Error("DISCORD_WEBHOOK_URL is not configured");
      }
      return ["discord"];
    } else if (explicitService === "slack") {
      if (!config.slackWebhookUrl) {
        throw new Error("SLACK_WEBHOOK_URL is not configured");
      }
      return ["slack"];
    }
  }

  // Auto-detect based on configuration
  return [config.autoDefault as "discord" | "slack"];
}

/**
 * Get service configuration status for reporting
 */
export function getServiceStatus(): {
  discordConfigured: boolean;
  slackConfigured: boolean;
  autoDefault: Service;
  bothConfigured: boolean;
} {
  const config = getConfig();
  
  return {
    discordConfigured: !!config.discordWebhookUrl,
    slackConfigured: !!config.slackWebhookUrl,
    autoDefault: config.autoDefault,
    bothConfigured: !!(config.discordWebhookUrl && config.slackWebhookUrl),
  };
}

/**
 * Clear cached configuration (useful for testing)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}
