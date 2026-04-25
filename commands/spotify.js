const axios = require("axios");

module.exports = {
  name: "spotify",
  aliases: ["sp", "spdl"],
  description: "Mengunduh lagu favorit Anda dari Spotify langsung ke format audio.",
  async execute(sock, m, args, { jid }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: "❌ *MASUKKAN LINK*\n\nSilakan lampirkan tautan lagu Spotify yang ingin Anda unduh!" }, { quoted: m });

    await sock.sendMessage(jid, { text: "⏳ *MENGUNDUH...*\n\nSedang memproses permintaan unduhan lagu Spotify Anda, mohon tunggu sebentar." }, { quoted: m });

    try {
      const res = await axios.post(`https://puruboy-api.vercel.app/api/downloader/spotify`, { url });
      const data = res.data;
      if (!data.success || !data.result?.download_url) throw new Error("Gagal mengambil data lagu.");

      await sock.sendMessage(jid, {
        audio: { url: data.result.download_url },
        mimetype: "audio/mpeg"
      }, { quoted: m });

      await sock.sendMessage(jid, { 
          text: `🎵 *SPOTIFY DOWNLOADER*\n\n` +
                `📌 *Judul:* ${data.result.title}\n` +
                `👤 *Artis:* ${data.result.artists}\n` +
                `────────────────────\n` +
                `✅ Audio berhasil dikirimkan.` 
      }, { quoted: m });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *GAGAL MENGUNDUH*\n\nTerjadi kesalahan saat mengunduh dari Spotify. Pastikan tautan valid dan coba beberapa saat lagi." }, { quoted: m });
    }
  }
};
