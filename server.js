// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { VoiceResponse } = require('twilio').twiml;
const axios = require('axios');
const base64 = require('base-64');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const VOICE = 'alloy';
const SYSTEM_MESSAGE = `You are a helpful and bubbly AI assistant who loves to chat about anything the user is interested in and is prepared to offer them facts. You have a penchant for dad jokes, owl jokes, and rickrolling – subtly. Always stay positive, but work in a joke when appropriate.`;

// Serve TwiML for Twilio call
app.post('/incoming-call', (req, res) => {
  const response = new VoiceResponse();
  response.say(
    'Please wait while we connect your call to the A. I. voice assistant, powered by Twilio and the Open-A.I. Realtime API'
  );
  response.pause({ length: 1 });
  response.say('O.K. you can start talking!');
  response.connect().stream({ url: `wss://${req.headers.host}/media-stream` });
  res.type('text/xml');
  res.send(response.toString());
});

// WebSocket Upgrade Handling
server.on('upgrade', (request, socket, head) => {
  if (request.url === '/media-stream') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      handleMediaStream(ws);
    });
  }
});

function handleMediaStream(clientWs) {
  console.log('Client connected');

  let streamSid = null;
  let openaiWs = null;

  (async () => {
    openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    openaiWs.on('open', async () => {
      console.log('Connected to OpenAI');
      await sendSessionUpdate(openaiWs);
    });

    openaiWs.on('message', async (data) => {
      const response = JSON.parse(data);
      if (response.type === 'response.audio.delta' && response.delta) {
        try {
          const audioPayload = base64.encode(base64.decode(response.delta));
          const audioDelta = {
            event: 'media',
            streamSid: streamSid,
            media: {
              payload: audioPayload
            }
          };
          clientWs.send(JSON.stringify(audioDelta));
        } catch (e) {
          console.error('Audio processing error:', e);
        }
      } else if (response.type === 'session.updated') {
        console.log('Session updated');
      }
    });

    clientWs.on('message', async (msg) => {
      const data = JSON.parse(msg);
      if (data.event === 'start') {
        streamSid = data.start.streamSid;
        console.log(`Stream started: ${streamSid}`);
      } else if (data.event === 'media' && openaiWs?.readyState === WebSocket.OPEN) {
        const audioAppend = {
          type: 'input_audio_buffer.append',
          audio: data.media.payload
        };
        openaiWs.send(JSON.stringify(audioAppend));
      }
    });

    clientWs.on('close', () => {
      console.log('Client disconnected');
      if (openaiWs?.readyState === WebSocket.OPEN) openaiWs.close();
    });
  })();
}

async function sendSessionUpdate(openaiWs) {
  const sessionUpdate = {
    type: 'session.update',
    session: {
      turn_detection: {
        type: 'server_vad'
      },
      input_audio_format: 'g711_ulaw',
      output_audio_format: 'g711_ulaw',
      voice: VOICE,
      instructions: SYSTEM_MESSAGE,
      modalities: ['text', 'audio'],
      temperature: 0.8
    }
  };
  openaiWs.send(JSON.stringify(sessionUpdate));
}

app.get('/', (req, res) => {
  res.send('<h1>Node.js Server is up</h1>');
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
