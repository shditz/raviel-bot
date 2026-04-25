module.exports = {
  name: "yaho",
  aliases: ["yahoo", "search"],
  description: "Mencari berita dari Yahoo Indonesia. Gunakan: !yaho <query>",
  async execute(sock, m, args, {jid}) {
    const query = args.join(" ").trim();
    if (!query) {
      return await sock.sendMessage(
        jid,
        {text: "❌ Masukkan query pencarian! Contoh: !yaho teknologi terbaru"},
        {quoted: m},
      );
    }

    try {
      await sock.sendMessage(jid, {text: "⏳ Sedang mencari berita..."}, {quoted: m});

      const apiUrl = `https://puruboy-api.vercel.app/api/search/yahoo?q=${encodeURIComponent(query)}`;
      const res = await fetch(apiUrl);

      if (!res.ok) {
        return await sock.sendMessage(
          jid,
          {text: `❌ Gagal menghubungi API. Status: ${res.status}`},
          {quoted: m},
        );
      }

      const data = await res.json();

      if (!data.success || !data.result || data.result.length === 0) {
        return await sock.sendMessage(
          jid,
          {text: `❌ Berita dengan query *${query}* tidak ditemukan.`},
          {quoted: m},
        );
      }

      let body = `📰 *HASIL PENCARIAN BERITA*\n\n`;
      body += `🔍 *Query:* ${query}\n`;
      body += `📊 *Total Hasil:* ${data.result.length}\n\n`;
      body += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      // Show first 10 results
      const results = data.result.slice(0, 10);
      results.forEach((item, i) => {
        body += `${i + 1}. *${item.title}*\n`;
        body += `📌 ${item.snippet}\n`;
        body += `🔗 ${item.link}\n\n`;
      });

      body += `━━━━━━━━━━━━━━━━━━━━━\n`;
      body += `\n✅ Menampilkan ${results.length} dari ${data.result.length} hasil pencarian.`;

      await sock.sendMessage(jid, {text: body}, {quoted: m});
    } catch (error) {
      console.error("Error in yaho command:", error);
      return await sock.sendMessage(
        jid,
        {text: "❌ Terjadi kesalahan saat mencari berita. Coba lagi nanti."},
        {quoted: m},
      );
    }
  },
};
