import { type DiscordPayloadParams, type SlackPayloadParams } from "./types.js";
import { safeJsonParse } from "./utils.js";

/**
 * Parse embed JSON safely, handling string, object, or array inputs
 */
export function parseEmbedJson(embedJson: unknown): unknown {
  if (typeof embedJson === "string") {
    const parsed = safeJsonParse(embedJson);
    if (parsed === null) {
      throw new Error("Invalid JSON in embed_json parameter");
    }
    return parsed;
  }
  
  return embedJson;
}

/**
 * Build Discord webhook payload
 */
export function buildDiscordPayload(params: DiscordPayloadParams): object {
  const { message, embedJson, username, avatarUrl, tts = false } = params;

  // Validate message length (Discord limit: 2000 characters)
  if (message && message.length > 2000) {
    throw new Error(`Discord message exceeds 2000 character limit (${message.length})`);
  }

  const payload: any = {};

  if (message) {
    payload.content = message;
  }

  if (username) {
    payload.username = username;
  }

  if (avatarUrl) {
    payload.avatar_url = avatarUrl;
  }

  if (tts) {
    payload.tts = true;
  }

  if (embedJson !== undefined) {
    const parsed = parseEmbedJson(embedJson);
    
    if (Array.isArray(parsed)) {
      // Array of embeds
      payload.embeds = parsed;
    } else if (parsed && typeof parsed === "object") {
      // Single embed object - wrap in array
      payload.embeds = [parsed];
    } else {
      throw new Error("Discord embed_json must be an object or array of objects");
    }
  }

  return payload;
}

/**
 * Build Slack webhook payload
 */
export function buildSlackPayload(params: SlackPayloadParams): object {
  const { message, embedJson, username, avatarUrl } = params;

  const payload: any = {};

  if (message) {
    payload.text = message;
  }

  if (username) {
    payload.username = username;
  }

  if (avatarUrl) {
    payload.icon_url = avatarUrl;
  }

  if (embedJson !== undefined) {
    const parsed = parseEmbedJson(embedJson);
    
    if (Array.isArray(parsed)) {
      // Array format: treat as blocks
      payload.blocks = parsed;
    } else if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      
      if ("attachments" in obj) {
        // Object contains attachments - merge the object directly
        Object.assign(payload, obj);
      } else {
        // Regular object - merge keys into payload
        Object.assign(payload, obj);
      }
    } else {
      throw new Error("Slack embed_json must be an object or array");
    }
  }

  return payload;
}
