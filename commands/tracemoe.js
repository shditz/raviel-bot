const axios = require("axios");
const { downloadContentFromMessage } = require("lilys-baileys");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = {
  name: "tracemoe",
  aliases: ["whatanime", "animeident"],
  description: "Mencari judul anime, nomor episode, dan cuplikan adegan berdasarkan screenshot gambar.",
  async execute(sock, m, args, { jid }) {
    const getMsg = (m) => {
      if (m.message?.imageMessage) return m.message.imageMessage;
      if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) return m.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
      const unwrap = (obj) => obj?.ephemeralMessage?.message || obj?.viewOnceMessage?.message || obj?.viewOnceMessageV2?.message || null;
      let content = m.message;
      for (let i = 0; i < 3; i++) {
        const inner = unwrap(content);
        if (!inner) break;
        content = inner;
      }
      return content?.imageMessage || null;
    };

    const msg = getMsg(m);

    if (!msg) {
      return await sock.sendMessage(jid, { text: "⚠️ *BUTUH SCREENSHOT*\n\nSilakan kirim atau balas (reply) cuplikan gambar anime dengan perintah *!tracemoe* untuk mengidentifikasinya." }, { quoted: m });
    }

    await sock.sendMessage(jid, { text: "🔍 *MENGIDENTIFIKASI...*\n\nSedang mencocokkan gambar Anda dengan ribuan data anime, mohon tunggu sebentar." }, { quoted: m });

    let publicId;
    try {
      const stream = await downloadContentFromMessage(msg, "image");
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const uploadRes = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: "tracemoe" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(buffer);
      });

      const publicUrl = uploadRes.secure_url;
      publicId = uploadRes.public_id;

      const response = await axios.get(`https://api.trace.moe/search?url=${encodeURIComponent(publicUrl)}`);
      
      if (!response.data?.result || response.data.result.length === 0) {
        return await sock.sendMessage(jid, { text: "❌ *TIDAK DITEMUKAN*\n\nMaaf, judul anime untuk gambar tersebut tidak dapat ditemukan di database." }, { quoted: m });
      }

      const result = response.data.result[0];
      const similarity = (result.similarity * 100).toFixed(2);
      
      const formatTime = (seconds) => {
        const date = new Date(0);
        date.setSeconds(seconds);
        return date.toISOString().substr(11, 8);
      };

      const fromTime = formatTime(result.from);
      const toTime = formatTime(result.to);

      let caption = `🎬 *ANIME BERHASIL DIIDENTIFIKASI*\n\n`;
      caption += `📌 *Judul:* ${result.filename || "Unknown"}\n`;
      caption += `🎞️ *Episode:* ${result.episode || "N/A"}\n`;
      caption += `✨ *Kemiripan:* ${similarity}%\n`;
      caption += `⏱️ *Waktu:* ${fromTime} - ${toTime}\n\n`;
      caption += `────────────────────\n`;
      caption += `_Gunakan data di atas untuk mencari anime favorit Anda._`;

      if (result.video) {
        await sock.sendMessage(jid, { 
          video: { url: result.video }, 
          caption: caption,
          mimetype: "video/mp4"
        }, { quoted: m });
      } else {
        await sock.sendMessage(jid, { text: caption }, { quoted: m });
      }

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *KESALAHAN PROSES*\n\nTerjadi kendala saat mengidentifikasi anime. Silakan coba kembali nanti." }, { quoted: m });
    } finally {
      if (publicId) await cloudinary.uploader.destroy(publicId).catch(() => {});
    }
  }
};
