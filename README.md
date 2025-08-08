# Twilio Media Stream to OpenAI WebSocket (Node.js)

This project sets up a **Node.js WebSocket server** that receives real-time audio streams from **Twilio Media Streams**, forwards them to the **OpenAI Realtime API**, and sends back AI-generated audio to the caller — enabling AI-powered, interactive voice calls.

---

## 🚀 Features

* Real-time audio streaming from **Twilio** to **OpenAI**
* Bidirectional audio — receive user speech and send AI speech back
* Compatible with **Twilio `<Stream>`** in Voice calls
* Built with **Node.js** and `ws` WebSocket library

---

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/MAlik81/node.js-twilio-OpenAI-Call-Agent.git
   cd your-repo-name
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create `.env` file**

   ```env
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Run the server**

   ```bash
   node server.js
   ```

---

## 🔌 Local Testing with ngrok

Twilio needs a **publicly accessible URL** to connect to your WebSocket.
You can expose your local server with **ngrok**.

1. **Install ngrok**

   * Download from [https://ngrok.com/download](https://ngrok.com/download)
   * Or install via npm:

     ```bash
     npm install -g ngrok
     ```

2. **Expose your local server**

   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL** from ngrok output, e.g.:

   ```
   https://abcd-1234.ngrok-free.app
   ```

---

## 📞 Connecting Twilio to Your WebSocket

You must configure your Twilio number to use a **TwiML Bin** or **Webhook** that contains a `<Stream>` element pointing to your WebSocket URL.

**Example TwiML:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting you to the AI assistant...</Say>
  <Connect>
    <Stream url="wss://abcd-1234.ngrok-free.app/media-stream" />
  </Connect>
</Response>
```

**Set this URL via Twilio Console:**

1. Go to **Twilio Console → Phone Numbers → Manage → Active Numbers**
2. Select your number.
3. Under **Voice & Fax**, set **Webhook** for "A Call Comes In" to your TwiML Bin or a public endpoint returning the XML above.

---

**Alternatively, set via Twilio API (Node.js):**

```js
const twilio = require('twilio');
const client = twilio('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN');

client.incomingPhoneNumbers('PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
  .update({
    voiceUrl: 'https://your-server.com/incoming-call',
    voiceMethod: 'POST'
  })
  .then(number => console.log(`Updated number: ${number.phoneNumber}`));
```

* Replace `PNxxxxxxxx...` with your **Phone Number SID** from the Twilio Console.
* The `/incoming-call` endpoint should respond with the TwiML containing `<Stream>`.

**Twilio API Docs:**
[https://www.twilio.com/docs/voice/twiml/stream](https://www.twilio.com/docs/voice/twiml/stream)
[https://www.twilio.com/docs/voice/api/incomingphonenumber-resource](https://www.twilio.com/docs/voice/api/incomingphonenumber-resource)

---

## 🧪 Testing WebSocket Connection

You can test the WebSocket manually before connecting Twilio:

* **WebSocket King**: [https://websocketking.com/](https://websocketking.com/)
* **Postman** (WebSocket request)
* **wscat** (CLI tool):

  ```bash
  npm install -g wscat
  wscat -c ws://localhost:3000
  ```

---

## 🛠 Tech Stack

* **Node.js** — Server runtime
* **ws** — WebSocket server
* **dotenv** — Environment variable management
* **Twilio** — Voice Media Streams
* **OpenAI Realtime API** — AI processing

---

## 📜 License

MIT License — feel free to use, modify, and share.
