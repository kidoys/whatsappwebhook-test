De# WhatsApp Business Webhook Server

A standalone Node.js webhook server for WhatsApp Business Account that receives messages, sends flow messages, and handles flow responses.

## Features

- ✅ Receives WhatsApp messages
- ✅ Sends interactive flow messages when user says "hi"
- ✅ Receives and logs flow responses
- ✅ No data persistence (you handle that separately)

## Setup Instructions

### 1. Clone/Download the Server

```bash
cd whatsapp-webhook
npm install
```

### 2. Get Your WhatsApp Credentials

You'll need:
- **Business Phone Number ID**: `928506217019746` (already provided)
- **Access Token**: Get from [Meta Business Platform](https://developers.facebook.com/)
- **Verify Token**: Create any random string (e.g., "my_verify_token_123")
- **Flow ID**: Create a flow in WhatsApp Business Manager and get the flow ID

### 3. Set Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_VERIFY_TOKEN=your_verify_token_here
WHATSAPP_FLOW_ID=your_flow_id_here
PORT=3001
```

### 4. Run the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on `http://localhost:3001`

### 5. Configure Webhook in WhatsApp Business Manager

1. Go to [Meta Business Platform](https://business.facebook.com/)
2. Navigate to **App** → **WhatsApp** → **Configuration**
3. Set up webhook:
   - **Webhook URL**: `https://yourdomain.com/webhook`
   - **Verify Token**: Same as `WHATSAPP_VERIFY_TOKEN` in `.env`
4. Subscribe to:
   - `messages`
   - `message_template_status_update`

### 6. Deploy Your Server

You can deploy to:
- **Heroku** (free tier available)
- **Railway** (simple deployment)
- **Replit** (quick setup)
- **AWS Lambda** + API Gateway (serverless)
- **DigitalOcean** (affordable VPS)

For production, you'll need:
- A public domain with HTTPS
- Environment variables configured

## API Endpoints

### GET `/webhook`
Webhook verification endpoint. WhatsApp uses this to verify your webhook during setup.

### POST `/webhook`
Receives messages and events from WhatsApp Business API.

**Incoming Message Format:**
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "1234567890",
          "type": "text",
          "text": { "body": "hi" }
        }],
        "metadata": {
          "phone_number_id": "928506217019746"
        }
      }
    }]
  }]
}
```

### GET `/health`
Health check endpoint. Returns server status.

## Message Flow

1. **User sends "hi"** → Server receives message
2. **Server sends flow message** → Interactive form appears on user's phone
3. **User submits flow** → Server logs the response (no storage)
4. **You handle the data** → Process/store as needed in your application

## Flow Response Handling

Flow responses arrive as `interactive` message type:

```json
{
  "from": "1234567890",
  "type": "interactive",
  "interactive": {
    "type": "nfm_reply",
    "nfm_reply": {
      "response_json": "{...}"
    }
  }
}
```

The console will log all flow responses. Add your own database logic later.

## Troubleshooting

### Webhook not verified
- Check your `WHATSAPP_VERIFY_TOKEN` matches in `.env` and WhatsApp manager
- Ensure server is publicly accessible

### Messages not received
- Confirm webhook is registered in WhatsApp Business Manager
- Check server logs for errors
- Verify phone number has WhatsApp Business API access

### Flow not sending
- Verify `WHATSAPP_FLOW_ID` is correct
- Check `WHATSAPP_ACCESS_TOKEN` has permission for flows
- Ensure recipient phone number is valid

## Notes

- Flow responses are logged to console, not persisted
- Add database integration later as needed
- Remember to set `ACCESS_TOKEN` with long-lived token for production
