module.exports = {
  name: "lirik",
  aliases: ["lyrics"],
  description: "Mencari lirik lagu. Gunakan: !lirik <nama_artis> <nama_lagu>",
  async execute(sock, m, args, {jid}) {
    const query = args.join(" ").trim();
    if (!query) {
      return await sock.sendMessage(
        jid,
        {text: "❌ Masukkan nama artis dan lagu! Contoh: !lirik Alan Walker Faded"},
        {quoted: m},
      );
    }

    try {
      const apiUrl = `https://puruboy-api.vercel.app/api/search/lyrics?q=${encodeURIComponent(query)}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!data.success || !data.result || data.result.length === 0) {
        return await sock.sendMessage(
          jid,
          {text: `❌ Lirik untuk *${query}* tidak ditemukan.`},
          {quoted: m},
        );
      }

      const lyric = data.result[0];
      let body = `🎵 *PENCARIAN LIRIK*\n\n`;
      body += `🎤 *Artis:* ${lyric.artist}\n`;
      body += `🎵 *Lagu:* ${lyric.track}\n`;
      body += `💿 *Album:* ${lyric.album}\n`;
      body += `⏱️ *Durasi:* ${Math.floor(lyric.duration / 60)}:${String(lyric.duration % 60).padStart(2, "0")}\n\n`;

      if (lyric.plainLyrics) {
        const lyrics = lyric.plainLyrics.substring(0, 1000);
        body += `📝 *Lirik:*\n${lyrics}...\n\n`;
        body += `_Tap untuk lirik lengkap dengan waktu sinkronisasi_`;
      } else {
        body += `❌ Lirik tidak tersedia untuk lagu ini.`;
      }

      await sock.sendMessage(jid, {text: body}, {quoted: m});
    } catch (error) {
      console.error("Error in lirik command:", error);
      return await sock.sendMessage(
        jid,
        {text: "❌ Terjadi kesalahan saat mencari lirik. Coba lagi nanti."},
        {quoted: m},
      );
    }
  },
};
