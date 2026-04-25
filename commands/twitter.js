const axios = require("axios");

module.exports = {
  name: "twitter",
  aliases: ["x", "twdl"],
  description: "Mengunduh media (Video/Foto) dari platform Twitter atau X secara instan.",
  async execute(sock, m, args, { jid }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: "❌ *MASUKKAN LINK*\n\nSilakan lampirkan tautan Twitter/X yang ingin Anda unduh!" }, { quoted: m });

    await sock.sendMessage(jid, { text: "⏳ *MENGUNDUH...*\n\nSedang memproses permintaan unduhan media X Anda, mohon tunggu sebentar." }, { quoted: m });

    try {
      const res = await axios.post(`https://puruboy-api.vercel.app/api/downloader/x`, { url });
      const data = res.data;
      if (!data.success || !data.result?.results?.length) throw new Error("Gagal mengambil data media.");

      const media = data.result.results[0];
      const caption = `🐦 *TWITTER / X DOWNLOADER*\n\n` +
                      `📝 *Deskripsi:* ${data.result.title || "-"}\n` +
                      `────────────────────\n` +
                      `✅ Media berhasil diunduh secara otomatis.`;

      if (media.type === "video") {
        await sock.sendMessage(jid, { video: { url: media.url }, caption }, { quoted: m });
      } else {
        await sock.sendMessage(jid, { image: { url: media.url }, caption }, { quoted: m });
      }
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *GAGAL MENGUNDUH*\n\nTerjadi kesalahan saat mengunduh dari Twitter/X. Pastikan tautan valid dan media tidak bersifat pribadi." }, { quoted: m });
    }
  }
};
