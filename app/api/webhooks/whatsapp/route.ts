import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Handle webhook verification (GET request from WhatsApp)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp] Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error('[WhatsApp] Webhook verification failed');
    return new NextResponse('Forbidden', { status: 403 });
  }
}

// Handle incoming webhook events (POST request from WhatsApp)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[WhatsApp] Incoming webhook:', JSON.stringify(body, null, 2));

    // Check if this is a message event
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages
    ) {
      const messages = body.entry[0].changes[0].value.messages;
      const contacts = body.entry[0].changes[0].value.contacts;

      for (const message of messages) {
        const senderPhoneNumber = message.from;
        const messageText = message.text?.body?.toLowerCase() || '';

        console.log(`[WhatsApp] Message from ${senderPhoneNumber}: ${messageText}`);

        // If user sends "hi", send back a flow message
        if (messageText === 'hi') {
          console.log(`[WhatsApp] Sending flow message to ${senderPhoneNumber}`);
          await sendFlowMessage(senderPhoneNumber);
        }
      }
    }

    // Check if this is a flow response event
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.interactive
    ) {
      const interactive = body.entry[0].changes[0].value.interactive;

      if (interactive.type === 'nfm_reply') {
        const flowResponse = interactive.nfm_reply;
        const senderPhoneNumber = body.entry[0].changes[0].value.messages?.[0]?.from;

        console.log(
          `[WhatsApp] Flow Response from ${senderPhoneNumber}:`,
          JSON.stringify(flowResponse, null, 2)
        );
        console.log(`[WhatsApp] Response body:`, flowResponse.response_json);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[WhatsApp] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Send a flow message to the user
async function sendFlowMessage(recipientPhoneNumber: string) {
  try {
    const flowMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhoneNumber,
      type: 'interactive',
      interactive: {
        type: 'flow',
        header: {
          type: 'text',
          text: 'Welcome!',
        },
        body: {
          text: 'Please fill out the form below:',
        },
        footer: {
          text: 'Powered by WhatsApp Business',
        },
        action: {
          type: 'navigate',
          next_screen: 'WELCOME',
          flow_token: 'AQAAAAACS5FpgQ_cAaYQcyUIW7o',
          flow_id: 'YOUR_FLOW_ID', // Replace with your actual flow ID
          flow_cta: 'Open Form',
        },
      },
    };

    const response = await axios.post(
      `https://graph.instagram.com/v21.0/${PHONE_NUMBER_ID}/messages`,
      flowMessage,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('[WhatsApp] Flow message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[WhatsApp] Error sending flow message:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error('[WhatsApp] Error sending flow message:', error);
    }
    throw error;
  }
}
