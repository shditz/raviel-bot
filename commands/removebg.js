const axios = require("axios");
const { downloadContentFromMessage } = require("lilys-baileys");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = {
  name: "removebg",
  aliases: ["rbg", "nobg"],
  description: "Menghapus latar belakang (background) gambar secara otomatis.",
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
      return await sock.sendMessage(jid, { text: "⚠️ *BUTUH GAMBAR*\n\nSilakan kirim gambar dengan caption *!removebg* atau balas (reply) gambar yang sudah ada dengan perintah *!removebg*." }, { quoted: m });
    }

    await sock.sendMessage(jid, { text: "⏳ *MOHON TUNGGU*\n\nSedang memproses penghapusan latar belakang gambar Anda. Mohon tunggu sebentar..." }, { quoted: m });

    let publicId;
    try {
      const stream = await downloadContentFromMessage(msg, "image");
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const uploadRes = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: "upload" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(buffer);
      });

      const publicUrl = uploadRes.secure_url;
      publicId = uploadRes.public_id;

      const response = await axios.post("https://puruboy-api.vercel.app/api/tools/removebg-v2", 
        { url: publicUrl }, 
        { headers: { "Content-Type": "application/json" } }
      );

      if (!response.data || !response.data.url) {
        throw new Error("Gagal mendapatkan hasil dari server.");
      }

      const finalImageUrl = response.data.url;

      const responseImg = await axios.get(finalImageUrl, { responseType: 'arraybuffer' });
      const finalBuffer = Buffer.from(responseImg.data);

      await sock.sendMessage(jid, {
        image: finalBuffer,
        caption: "✨ *BERHASIL DIHAPUS*\n\nLatar belakang gambar Anda telah berhasil dihapus secara otomatis."
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *KESALAHAN PROSES*\n\nMaaf, terjadi kendala saat menghapus latar belakang gambar. Silakan coba beberapa saat lagi." }, { quoted: m });
    } finally {
      if (typeof publicId !== "undefined") {
        await cloudinary.uploader.destroy(publicId).catch(() => {});
      }
    }
  }
};
