module.exports = {
  name: "wiki",
  aliases: ["wikipedia"],
  description: "Mencari informasi lengkap di ensiklopedia Wikipedia Indonesia.",
  async execute(sock, m, args, { jid }) {
    const query = args.join(" ");
    if (!query) {
      return await sock.sendMessage(jid, { text: "❌ *MASUKKAN TOPIK*\n\nSilakan masukkan topik yang ingin Anda cari di Wikipedia!\n*Contoh:* !wiki Albert Einstein" }, { quoted: m });
    }

    try {
      const searchUrl = `https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const searchRes = await fetch(searchUrl, {
        headers: { "User-Agent": "ShiraBot/1.0 (WhatsApp Bot; contact@example.com)" }
      });

      if (!searchRes.ok) {
        return await sock.sendMessage(jid, { text: "❌ *KESALAHAN KONEKSI*\n\nGagal menghubungi server Wikipedia Indonesia." }, { quoted: m });
      }

      const searchData = await searchRes.json();

      if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
        return await sock.sendMessage(jid, { text: `❌ *TIDAK DITEMUKAN*\n\nTopik *${query}* tidak ditemukan di dalam pangkalan data Wikipedia.` }, { quoted: m });
      }

      const bestTitle = searchData.query.search[0].title;

      const summaryUrl = `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`;
      const summaryRes = await fetch(summaryUrl, {
        headers: { "User-Agent": "ShiraBot/1.0 (WhatsApp Bot; contact@example.com)" }
      });

      if (!summaryRes.ok) {
        const introUrl = `https://id.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(bestTitle)}&format=json&origin=*`;
        const introRes = await fetch(introUrl, {
          headers: { "User-Agent": "ShiraBot/1.0 (WhatsApp Bot; contact@example.com)" }
        });
        const introData = await introRes.json();
        const pages = introData.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];

        if (!page || page.missing !== undefined) {
          return await sock.sendMessage(jid, { text: `❌ *TIDAK DITEMUKAN*\n\nTopik *${query}* tidak dapat dimuat saat ini.` }, { quoted: m });
        }

        const extract = page.extract ? page.extract.substring(0, 1500) : "Tidak ada ringkasan informasi.";
        const link = `https://id.wikipedia.org/wiki/${encodeURIComponent(bestTitle)}`;

        const body = `📚 *WIKIPEDIA INDONESIA*\n\n` +
                     `📌 *Topik:* ${page.title}\n` +
                     `────────────────────\n\n` +
                     `${extract}\n\n` +
                     `🔗 *Link Lengkap:* ${link}\n` +
                     `────────────────────`;

        return await sock.sendMessage(jid, { text: body }, { quoted: m });
      }

      const data = await summaryRes.json();

      let body = `📚 *WIKIPEDIA INDONESIA*\n\n` +
                 `📌 *Topik:* ${data.title}\n` +
                 `────────────────────\n\n` +
                 `${data.extract}\n\n` +
                 `🔗 *Link Lengkap:* ${data.content_urls.mobile.page}\n` +
                 `────────────────────`;

      if (data.thumbnail) {
        await sock.sendMessage(jid, {
          image: { url: data.thumbnail.source },
          caption: body
        }, { quoted: m });
      } else {
        await sock.sendMessage(jid, { text: body }, { quoted: m });
      }

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat memproses data Wikipedia. Silakan coba kembali nanti." }, { quoted: m });
    }
  }
};
