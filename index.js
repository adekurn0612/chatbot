import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

app.use(express.json());

// ✅ GET: Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified ✅");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// ✅ POST: Handle Messenger events
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry) {
      for (const webhook_event of entry.messaging) {
        const sender_psid = webhook_event.sender.id;

        console.log("📩 New message from:", sender_psid);

        if (webhook_event.message) {
          console.log("➡️ Message text:", webhook_event.message.text);
          await handleMessage(sender_psid, webhook_event.message);
        }
      }
    }
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// ✅ Handle incoming messages
async function handleMessage(sender_psid, received_message) {
  let response;

  if (received_message.text) {
    const msg = received_message.text.toLowerCase();

    if (msg.includes("menu")) {
      response = {
        text: "Silakan pilih:\n1. Info Produk\n2. Cek Pesanan\n3. Hubungi Admin",
      };
    } else if (msg.includes("1")) {
      response = { text: "Info Produk: Kami menjual paket data dan pulsa." };
    } else if (msg.includes("2")) {
      response = { text: "Cek Pesanan: Masukkan nomor order kamu." };
    } else if (msg.includes("3")) {
      response = { text: "Hubungi Admin: WA ke 08123456789" };
    } else {
      response = { text: "Ketik 'menu' untuk melihat pilihan." };
    }
  }

  await callSendAPI(sender_psid, response);
}

// ✅ Send message to user
async function callSendAPI(sender_psid, response) {
  const request_body = {
    recipient: { id: sender_psid },
    message: response,
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request_body),
      }
    );

    const data = await res.json();
    console.log("📤 Message sent:", data);
    return data;
  } catch (error) {
    console.error("❌ Unable to send message:", error);
  }
}

// ✅ EXTRA: Test API via Postman
app.post("/test-send", async (req, res) => {
  const { sender_psid, message } = req.body;

  if (!sender_psid || !message) {
    return res.status(400).json({ error: "sender_psid and message are required" });
  }

  try {
    const fbResponse = await callSendAPI(sender_psid, { text: message });
    res.status(200).json({ success: true, fb_response: fbResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
