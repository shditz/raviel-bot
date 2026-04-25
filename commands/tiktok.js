const axios = require("axios");

module.exports = {
  name: "tiktok",
  aliases: ["tt", "ttdl"],
  description: "Mengunduh video dari TikTok tanpa tanda air (no-watermark) secara instan.",
  async execute(sock, m, args, { jid }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: "❌ *MASUKKAN LINK*\n\nSilakan lampirkan tautan video TikTok yang ingin Anda unduh!" }, { quoted: m });

    await sock.sendMessage(jid, { text: "⏳ *MENGUNDUH...*\n\nSedang memproses permintaan unduhan video TikTok Anda, mohon tunggu sebentar." }, { quoted: m });

    try {
      const res = await axios.post(`https://puruboy-api.vercel.app/api/downloader/tiktok-v2`, { url });
      const data = res.data;
      if (!data.success || !data.result?.downloads?.length) throw new Error("Data tidak ditemukan.");

      const video = data.result.downloads.find(d => d.type.includes("MP4")) || data.result.downloads[0];
      const caption = `🎵 *TIKTOK DOWNLOADER*\n\n` +
                      `📝 *Judul:* ${data.result.title || "-"}\n` +
                      `────────────────────\n` +
                      `✅ Video berhasil diunduh tanpa watermark.`;

      await sock.sendMessage(jid, {
        video: { url: video.url },
        caption
      }, { quoted: m });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *GAGAL MENGUNDUH*\n\nTerjadi kesalahan saat mencoba mengunduh video. Pastikan tautan valid dan video tidak bersifat pribadi." }, { quoted: m });
    }
  }
};
