import fetch from "node-fetch";

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

export default async function handler(req, res) {
  if (req.method === "GET") {
    // ✅ Verifikasi Webhook
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verified");
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    }
  } else if (req.method === "POST") {
    // ✅ Terima Event dari Messenger
    const body = req.body;

    if (body.object === "page") {
      for (const entry of body.entry) {
        const webhook_event = entry.messaging[0];
        const sender_psid = webhook_event.sender.id;

        if (webhook_event.message) {
          await handleMessage(sender_psid, webhook_event.message);
        }
      }
      res.status(200).send("EVENT_RECEIVED");
    } else {
      res.sendStatus(404);
    }
  }
}

async function handleMessage(sender_psid, received_message) {
  let response;

  if (received_message.text) {
    const msg = received_message.text.toLowerCase();

    if (msg.includes("menu")) {
      response = { text: "Silakan pilih:\n1. Info Produk\n2. Cek Pesanan\n3. Hubungi Admin" };
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

async function callSendAPI(sender_psid, response) {
  const request_body = {
    recipient: { id: sender_psid },
    message: response,
  };

  await fetch(`https://graph.facebook.com/v12.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request_body),
  });
}
