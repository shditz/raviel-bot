const QRCode = require("qrcode");
const axios = require("axios");

module.exports = {
  name: "qr",
  aliases: ["qrcode"],
  description: "Pembuat (Generator) dan Pemindai (Scanner) kode QR secara praktis.",
  async execute(sock, m, args, {jid}) {
    const action = args[0]?.toLowerCase();

    if (action === "generate" || action === "gen") {
      const text = args.slice(1).join(" ");
      if (!text) return await sock.sendMessage(jid, {text: "❌ *MASUKKAN TEKS*\n\nGunakan format: *!qr generate <teks/url>* untuk membuat kode QR."}, {quoted: m});

      try {
        const qrBuffer = await QRCode.toBuffer(text, {
          errorCorrectionLevel: 'H',
          margin: 4,
          scale: 10
        });

        await sock.sendMessage(jid, {
          image: qrBuffer,
          caption: `✅ *QR CODE BERHASIL DIBUAT*\n\n📝 *Konten:* ${text}`
        }, {quoted: m});
      } catch (err) {
        console.error(err);
        await sock.sendMessage(jid, {text: "❌ *GAGAL*\n\nTerjadi kesalahan sistem saat mencoba membuat kode QR."}, {quoted: m});
      }
    } else if (action === "scan") {
      const q = m.message.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
      const type = Object.keys(q)[0];

      if (type !== "imageMessage") {
        return await sock.sendMessage(jid, {text: "⚠️ *BUTUH GAMBAR*\n\nSilakan balas (reply) sebuah gambar kode QR dengan perintah *!qr scan* untuk membacanya."}, {quoted: m});
      }

      await sock.sendMessage(jid, {text: "🔍 *MEMINDAI...*\n\nSedang memproses pembacaan kode QR, mohon tunggu sebentar."}, {quoted: m});

      try {
        const { downloadContentFromMessage } = require("lilys-baileys");
        const stream = await downloadContentFromMessage(q.imageMessage, "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }

        const FormData = require("form-data");
        const form = new FormData();
        form.append("file", buffer, "qr.png");

        const response = await axios.post("https://api.qrserver.com/v1/read-qr-code/", form, {
          headers: form.getHeaders()
        });

        const result = response.data[0]?.symbol[0];

        if (result?.data) {
          await sock.sendMessage(jid, {
            text: `✅ *PEMINDAIAN BERHASIL*\n\n📝 *Hasil:* \n\n${result.data}`
          }, {quoted: m});
        } else {
          await sock.sendMessage(jid, {text: "❌ *TIDAK TERDETEKSI*\n\nKode QR tidak dapat dibaca. Pastikan gambar jelas, tidak terpotong, dan merupakan kode QR yang valid."}, {quoted: m});
        }
      } catch (err) {
        console.error(err);
        await sock.sendMessage(jid, {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi server pemindai QR. Silakan coba beberapa saat lagi."}, {quoted: m});
      }
    } else {
      await sock.sendMessage(jid, {
        text: `❓ *PANDUAN QR CODE*\n\n` +
              `Silakan pilih salah satu perintah berikut:\n` +
              `┌──────────────────────────────\n` +
              `│ • *!qr generate <teks>* : Buat QR\n` +
              `│ • *!qr scan* : Baca QR (reply foto)\n` +
              `└──────────────────────────────`
      }, {quoted: m});
    }
  },
};
