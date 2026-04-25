module.exports = {
  name: "yaho",
  aliases: ["yahoo", "search"],
  description: "Mencari berita dan informasi terbaru dari mesin pencari Yahoo Indonesia.",
  async execute(sock, m, args, {jid}) {
    const query = args.join(" ").trim();
    if (!query) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *MASUKKAN QUERY*\n\nSilakan masukkan kata kunci pencarian Anda!\n*Contoh:* !yaho teknologi terbaru"},
        {quoted: m},
      );
    }

    try {
      await sock.sendMessage(jid, {text: "⏳ *MENCARI...*\n\nSedang mengumpulkan informasi berita terbaru, mohon tunggu sebentar."}, {quoted: m});

      const apiUrl = `https://puruboy-api.vercel.app/api/search/yahoo?q=${encodeURIComponent(query)}`;
      const res = await fetch(apiUrl);

      if (!res.ok) {
        return await sock.sendMessage(
          jid,
          {text: `❌ *KESALAHAN KONEKSI*\n\nGagal menghubungi server pencarian (${res.status}).`},
          {quoted: m},
        );
      }

      const data = await res.json();

      if (!data.success || !data.result || data.result.length === 0) {
        return await sock.sendMessage(
          jid,
          {text: `❌ *TIDAK DITEMUKAN*\n\nInformasi dengan kata kunci *${query}* tidak ditemukan.`},
          {quoted: m},
        );
      }

      let body = `📰 *HASIL PENCARIAN BERITA*\n\n`;
      body += `🔍 *Kata Kunci:* ${query}\n`;
      body += `────────────────────\n\n`;

      const results = data.result.slice(0, 8);
      results.forEach((item, i) => {
        body += `${i + 1}. *${item.title}*\n`;
        body += `📌 ${item.snippet}\n`;
        body += `🔗 _${item.link}_\n\n`;
      });

      body += `────────────────────\n`;
      body += `✅ Menampilkan ${results.length} berita paling relevan.`;

      await sock.sendMessage(jid, {text: body}, {quoted: m});
    } catch (error) {
      console.error("Error in yaho command:", error);
      return await sock.sendMessage(
        jid,
        {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat memproses pencarian. Silakan coba kembali nanti."},
        {quoted: m},
      );
    }
  },
};
