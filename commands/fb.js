const axios = require("axios");

module.exports = {
  name: "facebook",
  aliases: ["fb", "fbdl"],
  description: "Mengunduh video dari Facebook dengan kualitas HD secara otomatis.",
  async execute(sock, m, args, {jid}) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, {text: "❌ *MASUKKAN LINK*\n\nSilakan lampirkan tautan video Facebook yang ingin Anda unduh!"}, {quoted: m});

    await sock.sendMessage(jid, {text: "⏳ *MENGUNDUH...*\n\nSedang memproses permintaan unduhan video Facebook Anda, mohon tunggu sebentar."}, {quoted: m});

    try {
      const res = await axios.post(`https://puruboy-api.vercel.app/api/downloader/fbdl`, {url});
      const data = res.data;
      if (!data.success) throw new Error("Gagal mengambil data video.");

      const videoUrl = data.result.video_hd || data.result.video_sd;
      if (!videoUrl) throw new Error("Tautan video tidak ditemukan.");

      await sock.sendMessage(
        jid,
        {
          video: {url: videoUrl},
          caption: `🎥 *FACEBOOK DOWNLOADER*\n\n` +
                   `────────────────────\n` +
                   `✅ Video berhasil diunduh secara otomatis.`,
        },
        {quoted: m},
      );
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ *GAGAL MENGUNDUH*\n\nTerjadi kesalahan saat mengunduh dari Facebook. Pastikan tautan valid dan video tidak bersifat pribadi."}, {quoted: m});
    }
  },
};
