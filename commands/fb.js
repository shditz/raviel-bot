const axios = require("axios");

module.exports = {
  name: "facebook",
  aliases: ["fb", "fbdl"],
  description: "Mengunduh video dari Facebook. Gunakan: !fb <url>",
  async execute(sock, m, args, { jid }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: "❌ Masukkan link Facebook!" }, { quoted: m });

    await sock.sendMessage(jid, { text: "⏳ Sedang mengunduh video..." }, { quoted: m });

    try {
      const res = await axios.post(`https://puruboy-api.vercel.app/api/downloader/fbdl`, { url });
      const data = res.data;
      if (!data.success) throw new Error("No data");

      const videoUrl = data.result.video_hd || data.result.video_sd;
      if (!videoUrl) throw new Error("No video URL");

      await sock.sendMessage(jid, {
        video: { url: videoUrl },
        caption: "🎥 *Facebook Downloader*"
      }, { quoted: m });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal mengunduh video Facebook." }, { quoted: m });
    }
  }
};
