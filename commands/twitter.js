const axios = require("axios");

module.exports = {
  name: "twitter",
  aliases: ["x", "twdl"],
  description: "Mengunduh video dari Twitter/X. Gunakan: !twitter <url>",
  async execute(sock, m, args, { jid }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: "❌ Masukkan link Twitter/X!" }, { quoted: m });

    await sock.sendMessage(jid, { text: "⏳ Sedang mengunduh..." }, { quoted: m });

    try {
      const res = await axios.post(`https://puruboy-api.vercel.app/api/downloader/x`, { url });
      const data = res.data;
      if (!data.success || !data.result?.results?.length) throw new Error("No data");

      const media = data.result.results[0];
      const caption = `🐦 *Twitter/X Downloader*\n\n📝 ${data.result.title || "-"}`;

      if (media.type === "video") {
        await sock.sendMessage(jid, { video: { url: media.url }, caption }, { quoted: m });
      } else {
        await sock.sendMessage(jid, { image: { url: media.url }, caption }, { quoted: m });
      }
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal mengunduh dari Twitter/X." }, { quoted: m });
    }
  }
};
