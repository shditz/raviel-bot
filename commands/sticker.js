const { downloadContentFromMessage } = require("lilys-baileys");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const config = require("../config");

function getMediaMessage(msg) {
  if (!msg) return null;
  const type = Object.keys(msg)[0];
  if (type === "imageMessage" || type === "videoMessage") return { type: type === "imageMessage" ? "image" : "video", msg: msg[type] };
  
  const innerMsg = msg.viewOnceMessage?.message || msg.viewOnceMessageV2?.message || msg.viewOnceMessageV2Extension?.message || msg.ephemeralMessage?.message;
  if (innerMsg) return getMediaMessage(innerMsg);
  
  return null;
}

module.exports = {
  name: "sticker",
  aliases: ["s", "stiker"],
  description: "Mengubah gambar atau video pendek menjadi stiker WhatsApp berkualitas tinggi.",
  async execute(sock, m, args, { jid }) {
    try {
      const msg = m.message;
      if (!msg) return;

      let mediaObj = getMediaMessage(msg);
      
      if (!mediaObj && msg.extendedTextMessage?.contextInfo?.quotedMessage) {
        mediaObj = getMediaMessage(msg.extendedTextMessage.contextInfo.quotedMessage);
      }
      
      if (!mediaObj) {
        return await sock.sendMessage(jid, { 
            text: `⚠️ *BUTUH MEDIA*\n\nSilakan kirim atau balas (reply) *gambar* atau *video pendek* (maksimal 7 detik) dengan perintah *!sticker*.` 
        }, { quoted: m });
      }

      const { type, msg: mediaMsg } = mediaObj;

      if (type === "video" && mediaMsg.seconds > 10) {
        return await sock.sendMessage(jid, { 
            text: `❌ *DURASI TERLALU LAMA*\n\nMaaf, durasi video maksimal adalah 10 detik agar dapat dikonversi menjadi stiker animasi.` 
        }, { quoted: m });
      }

      await sock.sendMessage(jid, { 
          text: `⏳ *MOHON TUNGGU*\n\nSedang mengonversi ${type === "image" ? "gambar" : "video"} Anda menjadi stiker berkualitas tinggi...` 
      }, { quoted: m });

      const stream = await downloadContentFromMessage(mediaMsg, type);
      let buffer = Buffer.from([]);
      for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const sticker = new Sticker(buffer, {
        pack: config.botName,
        author: config.ownerName,
        type: StickerTypes.FULL,
        quality: 80
      });

      const stickerBuffer = await sticker.toBuffer();
      await sock.sendMessage(jid, { sticker: stickerBuffer }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { 
          text: `❌ *GAGAL MEMPROSES*\n\nMaaf, terjadi kesalahan saat pembuatan stiker. Pastikan format media valid dan tidak rusak.` 
      }, { quoted: m });
    }
  }
};
