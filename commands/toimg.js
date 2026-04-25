const { downloadContentFromMessage } = require("lilys-baileys");
const ffmpeg = require("ffmpeg-static");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "toimg",
  aliases: ["toimage"],
  description: "Mengonversi stiker WhatsApp kembali menjadi gambar (PNG).",
  async execute(sock, m, args, { jid }) {
    const q = m.message.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
    const type = Object.keys(q)[0];

    if (type !== "stickerMessage") {
      return await sock.sendMessage(jid, { text: "⚠️ *BUTUH STIKER*\n\nSilakan balas (reply) sebuah stiker dengan perintah *!toimg* untuk mengubahnya menjadi gambar." }, { quoted: m });
    }

    await sock.sendMessage(jid, { text: "⏳ *MOHON TUNGGU*\n\nSedang mengonversi stiker Anda menjadi gambar, mohon tunggu sebentar..." }, { quoted: m });

    try {
      const stream = await downloadContentFromMessage(q.stickerMessage, "sticker");
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      const inputPath = path.join(tempDir, `input_${Date.now()}.webp`);
      const outputPath = path.join(tempDir, `output_${Date.now()}.png`);

      fs.writeFileSync(inputPath, buffer);

      await new Promise((resolve, reject) => {
        exec(`"${ffmpeg}" -i ${inputPath} ${outputPath}`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const resultBuffer = fs.readFileSync(outputPath);

      await sock.sendMessage(jid, {
        image: resultBuffer,
        caption: "✨ *KONVERSI BERHASIL*\n\nStiker Anda telah berhasil dikonversi kembali menjadi format gambar."
      }, { quoted: m });

      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (err) {
      console.error("ToImg Error:", err);
      await sock.sendMessage(jid, { text: "❌ *GAGAL MEMPROSES*\n\nTerjadi kesalahan saat memproses stiker. Pastikan stiker yang Anda kirimkan valid dan tidak rusak." }, { quoted: m });
    }
  }
};
