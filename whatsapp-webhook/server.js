const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Configuration
const BUSINESS_PHONE_NUMBER_ID = '928506217019746';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN; // Set this in your .env file
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN; // Set this in your .env file
const PORT = process.env.PORT || 3001;

// Webhook verification endpoint (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Webhook receiver endpoint (POST)
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
      const message = body.entry[0].changes[0].value.messages[0];

      console.log('📨 Message received:', {
        from: message.from,
        type: message.type,
        text: message.text?.body || 'N/A',
      });

      // Handle text message
      if (message.type === 'text' && message.text.body.toLowerCase() === 'hi') {
        sendFlowMessage(phoneNumberId, message.from);
      }

      // Handle interactive response (flow response)
      if (message.type === 'interactive') {
        console.log('📊 Flow Response received:', {
          from: message.from,
          responseType: message.interactive.type,
          responseData: message.interactive,
        });

        // Just log it - you handle persistence later
        console.log('💾 Flow data received (not stored):', message.interactive);
      }

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } else {
    res.sendStatus(404);
  }
});

// Function to send flow message
async function sendFlowMessage(phoneNumberId, recipientPhone) {
  const url = `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipientPhone,
    type: 'interactive',
    interactive: {
      type: 'flow',
      header: {
        type: 'text',
        text: 'Welcome',
      },
      body: {
        text: 'Please fill out the form below',
      },
      footer: {
        text: 'Powered by WhatsApp',
      },
      action: {
        type: 'flow',
        flow_id: process.env.WHATSAPP_FLOW_ID, // Set your flow ID in .env
        flow_token: 'AQAAAAACS5FpgQ_cAAAAACS5FpgQ',
      },
    },
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Flow message sent:', response.data);
  } catch (error) {
    console.error('❌ Error sending flow message:', error.response?.data || error.message);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 WhatsApp webhook server running on port ${PORT}`);
  console.log(`📍 Webhook URL: https://yourdomain.com/webhook`);
});
