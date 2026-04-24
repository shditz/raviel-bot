const { downloadContentFromMessage } = require("lilys-baileys");
const { checkRemoveBgLimit } = require("../database/db");
require("dotenv").config();

async function removeBg(buffer) {
  const blob = new Blob([buffer], { type: "image/jpeg" });
  const formData = new FormData();
  formData.append("size", "auto");
  formData.append("image_file", blob);

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": process.env.REMOVE_BG_KEY || "" },
    body: formData,
  });

  if (response.ok) {
    return await response.arrayBuffer();
  } else {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
}

module.exports = {
  name: "removebg",
  aliases: ["rbg"],
  description: "Menghapus background gambar (Limit 1x/hari).",
  async execute(sock, m, args, { jid }) {
    if (!process.env.REMOVE_BG_KEY) {
      return await sock.sendMessage(jid, { text: "❌ Fitur ini belum dikonfigurasi (API Key kosong)." }, { quoted: m });
    }

    const msg = m.message;
    if (!msg) return;

    // Helper untuk mencari pesan gambar (seperti di sticker.js)
    let imageMsg = msg.imageMessage;
    if (!imageMsg && msg.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
      imageMsg = msg.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
    }

    if (!imageMsg) {
      return await sock.sendMessage(jid, { text: "❌ Balas gambar dengan !removebg atau kirim gambar dengan caption !removebg." }, { quoted: m });
    }

    // Cek limit
    const sender = m.key.participant || m.key.remoteJid;
    if (!checkRemoveBgLimit(sender)) {
      return await sock.sendMessage(jid, { text: "❌ Anda sudah menggunakan fitur Remove BG hari ini atau belum mendaftar. Limit adalah 1x per hari." }, { quoted: m });
    }

    await sock.sendMessage(jid, { text: "⏳ Sedang menghapus background..." }, { quoted: m });

    try {
      const stream = await downloadContentFromMessage(imageMsg, "image");
      let buffer = Buffer.from([]);
      for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const rbgResultData = await removeBg(buffer);
      const outputBuffer = Buffer.from(rbgResultData);

      await sock.sendMessage(jid, { 
        image: outputBuffer,
        caption: "✨ Berhasil menghapus background!"
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal menghapus background. Mungkin file terlalu besar atau server sedang sibuk." }, { quoted: m });
    }
  }
};
