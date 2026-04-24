const axios = require("axios");

module.exports = {
  name: "ig",
  aliases: ["igdl", "instagram"],
  description: "Mengunduh video/reels dari Instagram. Gunakan: !ig <url>",
  async execute(sock, m, args, { jid }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: "❌ Masukkan link Instagram!" }, { quoted: m });

    await sock.sendMessage(jid, { text: "⏳ Sedang mengunduh..." }, { quoted: m });

    try {
      const res = await axios.post(`https://puruboy-api.vercel.app/api/downloader/instagram`, { url });
      const data = res.data;
      if (!data.success || !data.result?.data?.url) throw new Error("No data");

      await sock.sendMessage(jid, {
        video: { url: data.result.data.url },
        caption: "🎥 *Instagram Downloader*"
      }, { quoted: m });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal mengunduh Instagram. Pastikan link valid dan akun tidak private." }, { quoted: m });
    }
  }
};
