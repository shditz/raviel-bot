module.exports = {
  name: "lirik",
  aliases: ["lyrics"],
  description: "Mencari lirik lagu dari berbagai artis dan judul secara akurat.",
  async execute(sock, m, args, {jid}) {
    const query = args.join(" ").trim();
    if (!query) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *MASUKKAN JUDUL*\n\nSilakan masukkan nama artis dan judul lagu!\n*Contoh:* !lirik Alan Walker Faded"},
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
          {text: `❌ *TIDAK DITEMUKAN*\n\nLirik untuk lagu *${query}* tidak dapat ditemukan di pangkalan data kami.`},
          {quoted: m},
        );
      }

      const lyric = data.result[0];
      let body = `🎵 *HASIL PENCARIAN LIRIK*\n\n`;
      body += `🎤 *Artis:* ${lyric.artist}\n`;
      body += `🎶 *Judul:* ${lyric.track}\n`;
      body += `💿 *Album:* ${lyric.album || "-"}\n`;
      body += `────────────────────\n\n`;

      if (lyric.plainLyrics) {
        body += `📝 *Lirik:*\n\n${lyric.plainLyrics}\n\n`;
      } else {
        body += `❌ *INFORMASI*\n\nLirik teks tidak tersedia untuk lagu ini di pangkalan data.`;
      }

      body += `────────────────────\n`;
      body += `_© ${lyric.artist} - ${lyric.track}_`;

      await sock.sendMessage(jid, {text: body}, {quoted: m});
    } catch (error) {
      console.error("Error in lirik command:", error);
      return await sock.sendMessage(
        jid,
        {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat mencoba mengambil data lirik. Silakan coba kembali nanti."},
        {quoted: m},
      );
    }
  },
};
