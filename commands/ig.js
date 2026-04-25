const axios = require("axios");

module.exports = {
  name: "ig",
  aliases: ["igdl", "instagram"],
  description: "Mengunduh Video, Reels, atau Foto dari Instagram secara praktis.",
  async execute(sock, m, args, { jid }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: "❌ *MASUKKAN LINK*\n\nSilakan lampirkan tautan Instagram (Reels/Video/Foto) yang ingin Anda unduh!" }, { quoted: m });

    await sock.sendMessage(jid, { text: "⏳ *MENGUNDUH...*\n\nSedang memproses permintaan unduhan Instagram Anda, mohon tunggu sebentar." }, { quoted: m });

    try {
      const res = await axios.post(`https://puruboy-api.vercel.app/api/downloader/instagram`, { url });
      const data = res.data;
      if (!data.success || !data.result?.data?.url) throw new Error("Gagal mengambil data media.");

      await sock.sendMessage(jid, {
        video: { url: data.result.data.url },
        caption: `📸 *INSTAGRAM DOWNLOADER*\n\n` +
                 `────────────────────\n` +
                 `✅ Media berhasil diunduh secara otomatis.`
      }, { quoted: m });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *GAGAL MENGUNDUH*\n\nTerjadi kesalahan saat mengunduh dari Instagram. Pastikan tautan valid dan akun tersebut tidak dikunci (private)." }, { quoted: m });
    }
  }
};
