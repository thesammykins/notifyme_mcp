# notify_me_mcp

> TypeScript MCP server for sending notifications to Discord and/or Slack webhooks

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D23.7.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)

A powerful Model Context Protocol (MCP) server that provides webhook notification capabilities to AI agents and LLM applications. Send rich notifications to Discord and Slack with automatic service detection, retry logic, and comprehensive security features.

## ✨ Features

- 🔧 **Three MCP Tools**: `send_notification`, `validate_webhook`, `list_services`
- 🎯 **Multi-Service Support**: Discord, Slack, or both simultaneously
- 🛡️ **Security First**: Webhook URLs never exposed in logs or process lists
- 📱 **Rich Content**: Discord embeds and Slack blocks/attachments support
- 🔄 **Robust Retry Logic**: Handles rate limiting with exponential backoff
- ⚡ **Service Auto-Detection**: Automatically selects available services
- 🔍 **Input Validation**: Comprehensive schema validation with Zod
- 📊 **Structured Logging**: Secure logging with automatic URL redaction

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 23.7.0
- **npm** ≥ 10.9.2
- Discord and/or Slack webhook URLs

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/thesammykins/notifyme_mcp.git
   cd notifyme_mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure webhooks**
   ```bash
   cp .env.example .env
   # Edit .env and replace webhook placeholders
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

### Configuration

Create a `.env` file with your webhook URLs:

```bash
# Discord webhook URL (optional)
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN"

# Slack webhook URL (optional)  
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00/B00/XXXX"

# Optional: Custom .env file location
# NOTIFY_ME_ENV_FILE="/path/to/custom/.env"
# NOTIFY_ME_ENV_DIR="/path/to/directory"
```

**Getting Webhook URLs:**

**Discord:**
1. Go to Server Settings → Integrations → Webhooks
2. Click "Create Webhook" → Copy webhook URL

**Slack:**
1. Create a Slack app at https://api.slack.com/apps
2. Enable "Incoming Webhooks" → Add to workspace
3. Copy the webhook URL

## 🔧 Usage with MCP Clients

### Claude Desktop Configuration

Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "notify_me_mcp": {
      "command": "node",
      "args": ["path/to/notifyme_mcp/dist/index.js"],
      "env": {
        "DISCORD_WEBHOOK_URL": "your_discord_webhook_url",
        "SLACK_WEBHOOK_URL": "your_slack_webhook_url"
      }
    }
  }
}
```

### Other MCP Clients

Use the built server at `dist/index.js` with any MCP-compatible client over stdio transport.

## 🛠️ Available Tools

### `send_notification`

Send notifications to Discord and/or Slack webhooks.

**Parameters:**
- `message` (string, optional): Plain text message
- `service` (string, optional): "discord", "slack", or "both" (auto-detected if not specified)
- `embed_json` (object/array/string, optional): Rich content (Discord embeds, Slack blocks)
- `username` (string, optional): Override display username
- `avatar_url` (string, optional): Override avatar/icon URL
- `tts` (boolean, optional): Enable text-to-speech (Discord only)

**Examples:**
```javascript
// Simple notification
{"message": "Task completed successfully ✅"}

// Target specific service
{"message": "Deploy finished", "service": "slack", "username": "CI Bot"}

// Discord embed
{
  "service": "discord",
  "embed_json": {
    "title": "Build Status", 
    "description": "All tests passed",
    "color": 65280
  }
}

// Slack blocks
{
  "service": "slack",
  "embed_json": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn", 
        "text": "*Deploy Complete* 🚀\nAll systems operational"
      }
    }
  ]
}
```

### `validate_webhook`

Test webhook connectivity by sending a test message.

**Parameters:**
- `service` (string, optional): "discord", "slack", or "both"
- `message` (string, optional): Custom test message

### `list_services`

List configured webhook services and auto-detected default.

**No parameters required.**

## 🏗️ Service Auto-Detection

The server automatically detects which services to use:

- **Only Discord configured** → `discord`
- **Only Slack configured** → `slack`
- **Both configured** → `discord` (default for backward compatibility)
- **Use `service: "both"`** → Send to all configured services

## 🔒 Security Features

- **Webhook Protection**: URLs never appear in logs, errors, or process lists
- **Secure Logging**: Automatic redaction of sensitive information
- **Input Validation**: All inputs validated with Zod schemas
- **Rate Limiting**: Automatic retry on 429 responses with `Retry-After` support
- **Temporary Files**: Created with restrictive permissions (077)

## 🎨 Rich Content Support

### Discord Embeds

Supports Discord's native embed objects:

```json
{
  "title": "Deployment Status",
  "description": "Production deployment completed",
  "color": 65280,
  "fields": [
    {"name": "Version", "value": "v1.2.3", "inline": true},
    {"name": "Duration", "value": "3m 42s", "inline": true}
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Slack Blocks & Attachments

Supports Slack's block kit and legacy attachments:

```json
// Blocks (recommended)
[
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "*Deployment Complete* 🚀\nVersion v1.2.3 deployed successfully"
    }
  }
]

// Attachments (legacy)
{
  "attachments": [
    {
      "color": "good",
      "title": "✅ Success",
      "text": "All tests passed",
      "fields": [
        {"title": "Environment", "value": "Production", "short": true}
      ]
    }
  ]
}
```

## 📊 Common Colors

| Status | Discord (decimal) | Slack (hex/keyword) |
|--------|-------------------|---------------------|
| Success | `65280` | `#36a64f` or `good` |
| Error | `16711680` | `#ff0000` or `danger` |
| Warning | `16753920` | `#ffa500` or `warning` |
| Info | `3447003` | `#3498db` |

## 🧪 Development

### Run in Development Mode
```bash
npm run dev  # Uses tsx with watch mode
```

### Build
```bash
npm run build  # Compiles TypeScript to dist/
```

### Start Production Server
```bash
npm start  # Runs compiled JavaScript
```

### Testing
```bash
npm test        # Run tests once
npm run test:watch  # Run tests in watch mode
```

## 📁 Project Structure

```
notify_me_mcp/
├── src/
│   ├── index.ts        # MCP server entry point
│   ├── config.ts       # Environment loading & service detection
│   ├── payload.ts      # Discord/Slack payload builders
│   ├── senders.ts      # HTTP senders with retry logic
│   ├── logger.ts       # Secure logging with redaction
│   ├── types.ts        # TypeScript interfaces & Zod schemas
│   └── utils.ts        # Helper functions
├── dist/               # Compiled JavaScript
├── .env.example        # Environment template
├── package.json        # Node.js configuration
├── tsconfig.json       # TypeScript configuration
└── README.md          # This file
```

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_WEBHOOK_URL` | Discord webhook URL | `https://discord.com/api/webhooks/...` |
| `SLACK_WEBHOOK_URL` | Slack webhook URL | `https://hooks.slack.com/services/...` |
| `NOTIFY_ME_ENV_FILE` | Custom .env file path | `/path/to/.env` |
| `NOTIFY_ME_ENV_DIR` | Custom .env directory | `/path/to/config` |

## 🐛 Troubleshooting

### Common Issues

**"No webhook URLs configured"**
- Ensure `.env` file exists with valid webhook URLs
- Check environment variable names match exactly

**"Discord message exceeds 2000 character limit"**
- Discord has a 2000 character limit for message content
- Use embeds for longer content or split messages

**"Invalid JSON in embed_json"**
- Validate JSON syntax before sending
- Use proper escaping for quotes in JSON strings

**Connection timeouts**
- Check network connectivity to Discord/Slack APIs
- Verify webhook URLs are correct and active

### Debug Mode

For troubleshooting, you can run with verbose logging:
```bash
DEBUG=* npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Build and test: `npm run build && npm test`
5. Commit your changes: `git commit -am 'Add some feature'`
6. Push to the branch: `git push origin feature/my-feature`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- **[notify_me.sh](https://github.com/original/notify_me)** - The original bash script that inspired this MCP server
- **[Model Context Protocol](https://modelcontextprotocol.io)** - Official MCP documentation
- **[Discord Webhooks](https://discord.com/developers/docs/resources/webhook)** - Discord webhook documentation
- **[Slack Webhooks](https://api.slack.com/messaging/webhooks)** - Slack incoming webhook documentation

## 🙋‍♂️ Support

- **Issues**: Report bugs and request features on [GitHub Issues](https://github.com/thesammykins/notifyme_mcp/issues)
- **Documentation**: Check this README and inline code comments
- **MCP Protocol**: Refer to [MCP documentation](https://modelcontextprotocol.io) for client setup

---

Built with ❤️ using TypeScript and the Model Context Protocol
