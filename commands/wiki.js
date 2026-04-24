module.exports = {
  name: "wiki",
  aliases: ["wikipedia"],
  description: "Mencari informasi di Wikipedia Indonesia. Gunakan: !wiki <topik>",
  async execute(sock, m, args, { jid }) {
    const query = args.join(" ");
    if (!query) {
      return await sock.sendMessage(jid, { text: "❌ Mau cari apa? Contoh: !wiki Albert Einstein" }, { quoted: m });
    }

    try {
      // Step 1: Search Wikipedia Indonesia untuk mendapatkan judul yang tepat
      const searchUrl = `https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const searchRes = await fetch(searchUrl, {
        headers: { "User-Agent": "ShiraBot/1.0 (WhatsApp Bot; contact@example.com)" }
      });

      if (!searchRes.ok) {
        return await sock.sendMessage(jid, { text: "❌ Gagal menghubungi Wikipedia." }, { quoted: m });
      }

      const searchData = await searchRes.json();

      if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
        return await sock.sendMessage(jid, { text: `❌ Topik *${query}* tidak ditemukan di Wikipedia.` }, { quoted: m });
      }

      const bestTitle = searchData.query.search[0].title;

      // Step 2: Get summary via REST API
      const summaryUrl = `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`;
      const summaryRes = await fetch(summaryUrl, {
        headers: { "User-Agent": "ShiraBot/1.0 (WhatsApp Bot; contact@example.com)" }
      });

      if (!summaryRes.ok) {
        // Fallback: ambil intro dari API action biasa
        const introUrl = `https://id.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(bestTitle)}&format=json&origin=*`;
        const introRes = await fetch(introUrl, {
          headers: { "User-Agent": "ShiraBot/1.0 (WhatsApp Bot; contact@example.com)" }
        });
        const introData = await introRes.json();
        const pages = introData.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];

        if (!page || page.missing !== undefined) {
          return await sock.sendMessage(jid, { text: `❌ Topik *${query}* tidak ditemukan.` }, { quoted: m });
        }

        const extract = page.extract ? page.extract.substring(0, 1500) : "Tidak ada ringkasan.";
        const link = `https://id.wikipedia.org/wiki/${encodeURIComponent(bestTitle)}`;

        const body = `📚 *Wikipedia Indonesia*\n\n` +
                     `📌 *Topik:* ${page.title}\n\n` +
                     `${extract}\n\n` +
                     `🔗 *Link:* ${link}`;

        return await sock.sendMessage(jid, { text: body }, { quoted: m });
      }

      const data = await summaryRes.json();

      let body = `📚 *Wikipedia Indonesia*\n\n` +
                 `📌 *Topik:* ${data.title}\n\n` +
                 `${data.extract}\n\n` +
                 `🔗 *Link:* ${data.content_urls.mobile.page}`;

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
      await sock.sendMessage(jid, { text: "❌ Gagal mengambil data dari Wikipedia." }, { quoted: m });
    }
  }
};
