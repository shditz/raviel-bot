module.exports = {
  name: "cuacaalert",
  aliases: ["alertcuaca", "peringatancuaca"],
  description: "Menampilkan peringatan dini cuaca aktif dari BMKG.",
  async execute(sock, m, args, { jid }) {
    try {
      const res = await fetch("https://www.bmkg.go.id/alerts/nowcast/id/rss.xml");
      if (!res.ok) {
        return await sock.sendMessage(jid, { text: "❌ Gagal menghubungi server BMKG." }, { quoted: m });
      }

      const xmlText = await res.text();

      // Parse RSS items dari XML secara manual (tanpa dependency tambahan)
      const items = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;

      while ((match = itemRegex.exec(xmlText)) !== null && items.length < 5) {
        const itemXml = match[1];

        const getTag = (tag) => {
          const r = new RegExp(`<${tag}>(.*?)</${tag}>`, "s");
          const m = itemXml.match(r);
          return m ? m[1].replace(/<!\[CDATA\[(.*?)\]\]>/s, "$1").trim() : "N/A";
        };

        items.push({
          title: getTag("title"),
          description: getTag("description"),
          pubDate: getTag("pubDate"),
          author: getTag("author"),
        });
      }

      if (items.length === 0) {
        return await sock.sendMessage(jid, { text: "✅ Tidak ada peringatan dini cuaca yang aktif saat ini." }, { quoted: m });
      }

      let body = `⚠️ *PERINGATAN DINI CUACA BMKG*\n\n`;

      items.forEach((item, i) => {
        body +=
          `╭─── 🔴 *Peringatan ${i + 1}* ───\n` +
          `│ 📌 *${item.title}*\n` +
          `│ 📅 ${item.pubDate}\n` +
          `│ 👤 ${item.author}\n` +
          `│\n` +
          `│ ${item.description}\n` +
          `╰──────────────────\n\n`;
      });

      body += `_Sumber: BMKG - Badan Meteorologi, Klimatologi, dan Geofisika_`;

      await sock.sendMessage(jid, { text: body }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal mengambil data peringatan cuaca dari BMKG." }, { quoted: m });
    }
  }
};
