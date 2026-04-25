const axios = require("axios");

module.exports = {
  name: "ytmp4",
  aliases: ["ytvideo", "ytv"],
  description: "Mengunduh video dari YouTube dengan kualitas terbaik.",
  async execute(sock, m, args, { jid }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: "❌ *MASUKKAN LINK*\n\nSilakan lampirkan tautan video YouTube yang ingin Anda unduh!" }, { quoted: m });

    await sock.sendMessage(jid, { text: "⏳ *MENGUNDUH...*\n\nSedang memproses permintaan unduhan video YouTube Anda, mohon tunggu sebentar." }, { quoted: m });

    try {
      const res = await axios.post(`https://puruboy-api.vercel.app/api/downloader/youtube`, { url });
      const data = res.data;
      if (!data.success || !data.result?.downloadUrl) throw new Error("Gagal mengambil data video.");

      const caption = `🎥 *YOUTUBE DOWNLOADER*\n\n` +
                      `📌 *Judul:* ${data.result.title || "-"}\n` +
                      `📦 *Ukuran:* ${data.result.size || "-"}\n` +
                      `────────────────────\n` +
                      `✅ Video berhasil diunduh secara otomatis.`;

      await sock.sendMessage(jid, {
        video: { url: data.result.downloadUrl },
        caption
      }, { quoted: m });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *GAGAL MENGUNDUH*\n\nTerjadi kesalahan saat mengunduh video YouTube. Pastikan tautan valid dan coba beberapa saat lagi." }, { quoted: m });
    }
  }
};
