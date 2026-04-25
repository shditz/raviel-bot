const axios = require("axios");

module.exports = {
  name: "ytmp3",
  aliases: ["ytaudio", "yta"],
  description: "Mengunduh audio atau lagu (MP3) dari YouTube secara praktis.",
  async execute(sock, m, args, { jid }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: "❌ *MASUKKAN LINK*\n\nSilakan lampirkan tautan video YouTube yang ingin Anda ambil audionya!" }, { quoted: m });

    await sock.sendMessage(jid, { text: "⏳ *MENGUNDUH...*\n\nSedang memproses konversi audio YouTube Anda, mohon tunggu sebentar." }, { quoted: m });

    try {
      const res = await axios.post(`https://puruboy-api.vercel.app/api/downloader/ytmp3`, { url });
      const data = res.data;
      if (!data.success || !data.result?.download_url) throw new Error("Gagal mengambil data audio.");

      await sock.sendMessage(jid, {
        audio: { url: data.result.download_url },
        mimetype: "audio/mpeg"
      }, { quoted: m });
      
      await sock.sendMessage(jid, { text: "✅ *BERHASIL*\n\nAudio telah berhasil dikonversi dan dikirimkan." }, { quoted: m });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *GAGAL MENGUNDUH*\n\nTerjadi kesalahan saat mengunduh audio YouTube. Pastikan tautan valid dan coba beberapa saat lagi." }, { quoted: m });
    }
  }
};
