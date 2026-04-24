const { downloadContentFromMessage } = require("lilys-baileys");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const config = require("../config");

function getMediaMessage(msg) {
  if (!msg) return null;
  const type = Object.keys(msg)[0];
  if (type === "imageMessage" || type === "videoMessage") return { type: type === "imageMessage" ? "image" : "video", msg: msg[type] };
  
  // Handle viewOnce, ephemeral, etc.
  const innerMsg = msg.viewOnceMessage?.message || msg.viewOnceMessageV2?.message || msg.viewOnceMessageV2Extension?.message || msg.ephemeralMessage?.message;
  if (innerMsg) return getMediaMessage(innerMsg);
  
  return null;
}

module.exports = {
  name: "sticker",
  aliases: ["s", "stiker"],
  description: "Mengubah gambar atau video menjadi stiker. Balas atau kirim media dengan caption !sticker.",
  async execute(sock, m, args, { jid }) {
    try {
      const msg = m.message;
      if (!msg) return;

      let mediaObj = getMediaMessage(msg);
      
      // Jika tidak ada di pesan utama, cek pesan yang di-quote
      if (!mediaObj && msg.extendedTextMessage?.contextInfo?.quotedMessage) {
        mediaObj = getMediaMessage(msg.extendedTextMessage.contextInfo.quotedMessage);
      }
      
      if (!mediaObj) {
        return await sock.sendMessage(jid, { text: "❌ Kirim/balas gambar atau video (max 7 detik) dengan caption !sticker" }, { quoted: m });
      }

      const { type, msg: mediaMsg } = mediaObj;

      // Validasi durasi video (WhatsApp sticker limit is small)
      if (type === "video" && mediaMsg.seconds > 10) {
        return await sock.sendMessage(jid, { text: "❌ Durasi video terlalu panjang! Maksimal 10 detik agar bisa jadi stiker." }, { quoted: m });
      }

      await sock.sendMessage(jid, { text: `⏳ Sedang memproses ${type === "image" ? "gambar" : "video"} menjadi stiker...` }, { quoted: m });

      const stream = await downloadContentFromMessage(mediaMsg, type);
      let buffer = Buffer.from([]);
      for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const sticker = new Sticker(buffer, {
        pack: config.botName,
        author: config.ownerName,
        type: StickerTypes.FULL,
        quality: 70
      });

      const stickerBuffer = await sticker.toBuffer();
      await sock.sendMessage(jid, { sticker: stickerBuffer }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal membuat stiker! Pastikan format media didukung." }, { quoted: m });
    }
  }
};
