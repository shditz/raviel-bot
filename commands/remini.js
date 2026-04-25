const axios = require("axios");
const { downloadContentFromMessage } = require("lilys-baileys");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = {
  name: "remini",
  aliases: ["hd", "upscale"],
  description: "Meningkatkan kualitas gambar menjadi HD (Upscale) secara otomatis.",
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
      return await sock.sendMessage(jid, { text: "⚠️ *BUTUH GAMBAR*\n\nSilakan kirim gambar dengan caption *!remini* atau balas (reply) gambar yang sudah ada dengan perintah *!remini*." }, { quoted: m });
    }

    await sock.sendMessage(jid, { text: "⏳ *MOHON TUNGGU*\n\nSedang memproses peningkatan kualitas gambar menjadi HD. Proses ini memerlukan waktu sekitar 15-30 detik..." }, { quoted: m });

    try {
      const stream = await downloadContentFromMessage(msg, "image");
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      if (buffer.length === 0) throw new Error("Gagal mengunduh gambar.");

      const uploadRes = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: "upload" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(buffer);
      });

      const publicUrl = uploadRes.secure_url;
      const publicId = uploadRes.public_id;

      const responseUpscale = await axios.post("https://puruboy-api.vercel.app/api/tools/upscale", 
        { url: publicUrl }, 
        { responseType: 'stream' }
      ).catch(err => {
        throw new Error(`Koneksi API Gagal (${err.response?.status})`);
      });

      let resultJsonUrl = "";
      let bufferedText = "";
      await new Promise((resolve) => {
        let timeout = setTimeout(() => resolve(), 60000);
        responseUpscale.data.on('data', (chunk) => {
          bufferedText += chunk.toString();
          if (bufferedText.includes('[true]')) {
            const parts = bufferedText.split('[true]');
            resultJsonUrl = parts[1].trim().split('\n')[0].trim();
            clearTimeout(timeout);
            resolve();
          }
        });
        responseUpscale.data.on('end', () => resolve());
      });

      if (!resultJsonUrl) throw new Error("Gagal mendapatkan hasil dari server.");

      const resJson = await axios.get(resultJsonUrl);
      const finalImageUrl = resJson.data.output;

      const responseImg = await axios.get(finalImageUrl, { responseType: 'arraybuffer' });
      const finalBuffer = Buffer.from(responseImg.data);

      await sock.sendMessage(jid, {
        image: finalBuffer,
        caption: "✨ *PENINGKATAN BERHASIL*\n\nGambar Anda telah berhasil ditingkatkan kualitasnya menjadi High Definition (HD)."
      }, { quoted: m });

      await cloudinary.uploader.destroy(publicId).catch(() => {});

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *KESALAHAN PROSES*\n\nMaaf, terjadi kendala saat meningkatkan kualitas gambar. Silakan coba kembali dengan gambar yang lebih jelas." }, { quoted: m });
    }
  }
};
