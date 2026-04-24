const axios = require("axios");

module.exports = {
  name: "ytmp4",
  aliases: ["ytvideo", "ytv"],
  description: "Mengunduh video dari YouTube. Gunakan: !ytmp4 <url>",
  async execute(sock, m, args, { jid }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: "❌ Masukkan link YouTube!" }, { quoted: m });

    await sock.sendMessage(jid, { text: "⏳ Sedang mengunduh video..." }, { quoted: m });

    try {
      const res = await axios.post(`https://puruboy-api.vercel.app/api/downloader/youtube`, { url });
      const data = res.data;
      if (!data.success || !data.result?.downloadUrl) throw new Error("No data");

      await sock.sendMessage(jid, {
        video: { url: data.result.downloadUrl },
        caption: `🎥 *${data.result.title || "YouTube Video"}*\n📦 Size: ${data.result.size || "-"}`
      }, { quoted: m });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal mengunduh video YouTube." }, { quoted: m });
    }
  }
};
