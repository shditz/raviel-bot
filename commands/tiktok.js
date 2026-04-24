const axios = require("axios");

module.exports = {
  name: "tiktok",
  aliases: ["tt", "ttdl"],
  description: "Mengunduh video TikTok tanpa watermark. Gunakan: !tiktok <url>",
  async execute(sock, m, args, { jid }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: "❌ Masukkan link TikTok!" }, { quoted: m });

    await sock.sendMessage(jid, { text: "⏳ Sedang mengunduh..." }, { quoted: m });

    try {
      const res = await axios.post(`https://puruboy-api.vercel.app/api/downloader/tiktok-v2`, { url });
      const data = res.data;
      if (!data.success || !data.result?.downloads?.length) throw new Error("No data");

      const video = data.result.downloads.find(d => d.type.includes("MP4")) || data.result.downloads[0];
      const caption = `🎵 *TikTok Downloader*\n\n📝 ${data.result.title || "-"}`;

      await sock.sendMessage(jid, {
        video: { url: video.url },
        caption
      }, { quoted: m });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal mengunduh video TikTok." }, { quoted: m });
    }
  }
};
