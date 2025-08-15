import { z } from "zod";

// Core service types
export type Service = "discord" | "slack" | "both";

// Configuration interfaces
export interface Config {
  discordWebhookUrl?: string;
  slackWebhookUrl?: string;
  autoDefault: Service;
}

// Send parameters interface
export interface SendParams {
  message?: string;
  service?: Service;
  embed_json?: string | object | unknown[];
  username?: string;
  avatar_url?: string;
  tts?: boolean;
}

// Tool response interfaces
export interface ServiceResult {
  service: "discord" | "slack";
  success: boolean;
  httpCode?: number;
  messageId?: string;
  timestamp?: string;
  error?: string;
}

export interface SendResult {
  success: boolean;
  overall: boolean;
  results: ServiceResult[];
}

export interface ServiceStatus {
  discordConfigured: boolean;
  slackConfigured: boolean;
  autoDefault: Service;
  bothConfigured: boolean;
}

// Zod schemas for tool input validation
export const ServiceSchema = z.enum(["discord", "slack", "both"]);

export const SendNotificationSchema = z.object({
  message: z.string().optional(),
  service: ServiceSchema.optional(),
  embed_json: z.union([z.string(), z.object({}).passthrough(), z.array(z.unknown())]).optional(),
  username: z.string().optional(),
  avatar_url: z.string().url().optional(),
  tts: z.boolean().optional(),
});

export const ValidateWebhookSchema = z.object({
  service: ServiceSchema.optional(),
  message: z.string().optional(),
});

export const ListServicesSchema = z.object({});

// Payload builder interfaces
export interface DiscordPayloadParams {
  message?: string;
  embedJson?: unknown;
  username?: string;
  avatarUrl?: string;
  tts?: boolean;
}

export interface SlackPayloadParams {
  message?: string;
  embedJson?: unknown;
  username?: string;
  avatarUrl?: string;
}

// HTTP response interfaces
export interface HttpResult {
  success: boolean;
  httpCode: number;
  messageId?: string;
  timestamp?: string;
}
