#!/usr/bin/env node

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { type SendResult, type ServiceResult } from "./types.js";
import { getConfig, detectService, getServiceStatus } from "./config.js";
import { buildDiscordPayload, buildSlackPayload } from "./payload.js";
import { sendDiscord, sendSlack } from "./senders.js";
import logger from "./logger.js";

const server = new McpServer(
  { 
    name: "notify_me_mcp", 
    version: "0.1.0" 
  }, 
  { 
    capabilities: {
      tools: {},
    },
  }
);

// Tool: list_services  
server.tool(
  "list_services",
  "List configured webhook services and auto-detected default",
  {},
  async () => {
    const status = getServiceStatus();
    
    const result = {
      discordConfigured: status.discordConfigured,
      slackConfigured: status.slackConfigured, 
      autoDefault: status.autoDefault,
      bothConfigured: status.bothConfigured
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
);

// Tool: validate_webhook
server.tool(
  "validate_webhook",
  "Test webhook connectivity by sending a test message",
  {
    service: z.enum(["discord", "slack", "both"]).optional(),
    message: z.string().optional(),
  },
  async (args) => {
    const testMessage = args.message || "notify_me_mcp connectivity test";
    
    try {
      const targetServices = detectService(args.service);
      const config = getConfig();
      const results: ServiceResult[] = [];

      for (const service of targetServices) {
        try {
          let result;
          
          if (service === "discord") {
            const payload = buildDiscordPayload({ message: testMessage });
            result = await sendDiscord(config.discordWebhookUrl!, payload);
          } else {
            const payload = buildSlackPayload({ message: testMessage });
            result = await sendSlack(config.slackWebhookUrl!, payload);
          }

          results.push({
            service,
            success: result.success,
            httpCode: result.httpCode,
            timestamp: result.timestamp
          });
        } catch (error) {
          results.push({
            service,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      const overall = results.some(r => r.success);
      const response: SendResult = {
        success: overall,
        overall,
        results
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2)
          }
        ]
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text", 
            text: JSON.stringify({ error: errorMsg }, null, 2)
          }
        ]
      };
    }
  }
);

// Tool: send_notification
server.tool(
  "send_notification",
  "Send a notification to Discord and/or Slack webhooks",
  {
    message: z.string().optional(),
    service: z.enum(["discord", "slack", "both"]).optional(),
    embed_json: z.union([z.string(), z.object({}).passthrough(), z.array(z.unknown())]).optional(),
    username: z.string().optional(),
    avatar_url: z.string().url().optional(),
    tts: z.boolean().optional(),
  },
  async (args) => {
    // Validate that either message or embed_json is provided
    if (!args.message && args.embed_json === undefined) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ 
              error: "You must provide either message or embed_json parameter" 
            }, null, 2)
          }
        ]
      };
    }

    try {
      const targetServices = detectService(args.service);
      const config = getConfig();
      const results: ServiceResult[] = [];

      for (const service of targetServices) {
        try {
          let result;
          
          if (service === "discord") {
            const payload = buildDiscordPayload({
              message: args.message,
              embedJson: args.embed_json,
              username: args.username,
              avatarUrl: args.avatar_url,
              tts: args.tts
            });
            result = await sendDiscord(config.discordWebhookUrl!, payload);
          } else {
            const payload = buildSlackPayload({
              message: args.message,
              embedJson: args.embed_json,
              username: args.username,
              avatarUrl: args.avatar_url
            });
            result = await sendSlack(config.slackWebhookUrl!, payload);
          }

          results.push({
            service,
            success: result.success,
            httpCode: result.httpCode,
            timestamp: result.timestamp
          });
        } catch (error) {
          results.push({
            service,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      const overall = results.some(r => r.success);
      const response: SendResult = {
        success: overall,
        overall,
        results
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2)
          }
        ]
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: errorMsg }, null, 2)
          }
        ]
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("notify_me_mcp server started");
}

main().catch((error) => {
  logger.error("Failed to start server", { error });
  process.exit(1);
});
