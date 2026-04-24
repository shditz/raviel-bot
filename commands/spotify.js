const axios = require("axios");

module.exports = {
  name: "spotify",
  aliases: ["sp", "spdl"],
  description: "Mengunduh lagu dari Spotify. Gunakan: !spotify <url>",
  async execute(sock, m, args, { jid }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: "❌ Masukkan link Spotify!" }, { quoted: m });

    await sock.sendMessage(jid, { text: "⏳ Sedang mengunduh lagu..." }, { quoted: m });

    try {
      const res = await axios.post(`https://puruboy-api.vercel.app/api/downloader/spotify`, { url });
      const data = res.data;
      if (!data.success || !data.result?.download_url) throw new Error("No data");

      const caption = `🎵 *${data.result.title}*\n👤 ${data.result.artists}`;

      await sock.sendMessage(jid, {
        audio: { url: data.result.download_url },
        mimetype: "audio/mpeg"
      }, { quoted: m });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal mengunduh dari Spotify." }, { quoted: m });
    }
  }
};
