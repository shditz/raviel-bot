const axios = require("axios");

module.exports = {
  name: "ytmp3",
  aliases: ["ytaudio", "yta"],
  description: "Mengunduh audio/lagu dari YouTube. Gunakan: !ytmp3 <url>",
  async execute(sock, m, args, { jid }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: "❌ Masukkan link YouTube!" }, { quoted: m });

    await sock.sendMessage(jid, { text: "⏳ Sedang mengunduh audio..." }, { quoted: m });

    try {
      const res = await axios.post(`https://puruboy-api.vercel.app/api/downloader/ytmp3`, { url });
      const data = res.data;
      if (!data.success || !data.result?.download_url) throw new Error("No data");

      await sock.sendMessage(jid, {
        audio: { url: data.result.download_url },
        mimetype: "audio/mpeg"
      }, { quoted: m });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal mengunduh audio YouTube." }, { quoted: m });
    }
  }
};
