const axios = require("axios");
const { downloadContentFromMessage } = require("lilys-baileys");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = {
  name: "smeme",
  aliases: ["stickermeme"],
  description: "Membuat stiker meme dengan teks kustom di bagian atas dan bawah.",
  async execute(sock, m, args, { jid, PREFIX }) {
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
      return await sock.sendMessage(jid, { 
        text: `⚠️ *BUTUH GAMBAR*\n\nSilakan kirim atau balas (reply) gambar dengan caption *${PREFIX}smeme teks_atas | teks_bawah*` 
      }, { quoted: m });
    }

    const fullText = args.join(" ");
    if (!fullText.includes("|")) {
      return await sock.sendMessage(jid, { 
        text: `❌ *FORMAT SALAH*\n\nGunakan tanda pemisah *|* untuk memisahkan teks bagian atas dan bawah.\n\n*Contoh:* \n${PREFIX}smeme lu asik | gw mabar` 
      }, { quoted: m });
    }

    const [top, bottom] = fullText.split("|").map(t => t.trim().replace(/\s+/g, "_").replace(/\?/g, "~q").replace(/\%/g, "~p").replace(/\#/g, "~h").replace(/\//g, "~s"));

    await sock.sendMessage(jid, { 
        text: `⏳ *MOHON TUNGGU*\n\nSedang memproses pembuatan stiker meme kustom Anda, mohon tunggu sebentar...` 
    }, { quoted: m });

    let publicId;
    try {
      const stream = await downloadContentFromMessage(msg, "image");
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const uploadRes = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: "smeme" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(buffer);
      });

      const publicUrl = uploadRes.secure_url;
      publicId = uploadRes.public_id;

      const memeUrl = `https://api.memegen.link/images/custom/${top || "_"}/${bottom || "_"}.png?background=${publicUrl}`;
      
      const responseImg = await axios.get(memeUrl, { responseType: 'arraybuffer' });
      const memeBuffer = Buffer.from(responseImg.data);

      const sticker = new Sticker(memeBuffer, {
        pack: "Raviel Bot",
        author: "ShDitz",
        type: StickerTypes.FULL,
        quality: 80,
      });

      const stickerBuffer = await sticker.toBuffer();
      await sock.sendMessage(jid, { sticker: stickerBuffer }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *GAGAL MEMPROSES*\n\nTerjadi kesalahan saat membuat stiker meme. Pastikan teks tidak terlalu panjang dan gambar valid." }, { quoted: m });
    } finally {
      if (publicId) await cloudinary.uploader.destroy(publicId).catch(() => {});
    }
  }
};
