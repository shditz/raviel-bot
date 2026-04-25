module.exports = {
  name: "cuacaalert",
  aliases: ["alertcuaca", "peringatancuaca"],
  description: "Menampilkan informasi peringatan dini cuaca aktif yang dikeluarkan oleh BMKG.",
  async execute(sock, m, args, { jid }) {
    try {
      const res = await fetch("https://www.bmkg.go.id/alerts/nowcast/id/rss.xml");
      if (!res.ok) {
        return await sock.sendMessage(jid, { text: "❌ *KESALAHAN KONEKSI*\n\nGagal menghubungi server BMKG." }, { quoted: m });
      }

      const xmlText = await res.text();

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
        return await sock.sendMessage(jid, { text: "✅ *CUACA AMAN*\n\nTidak ada peringatan dini cuaca yang aktif untuk wilayah Indonesia saat ini." }, { quoted: m });
      }

      let body = `⚠️ *PERINGATAN DINI CUACA BMKG*\n\n`;

      items.forEach((item, i) => {
        body +=
          `╭━━━━━━━ 🔴 *ALERT ${i + 1}* ━━━━━━━╮\n` +
          `┃\n` +
          `┃ 📌 *Judul:* \n┃ ${item.title}\n` +
          `┃\n` +
          `┃ 📅 *Waktu:* ${item.pubDate}\n` +
          `┃ 👤 *Sumber:* ${item.author}\n` +
          `┃\n` +
          `┃ 📝 *Keterangan:* \n` +
          `┃ ${item.description.split("\n").join("\n┃ ")}\n` +
          `┃\n` +
          `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      });

      body += `_Sumber: BMKG Indonesia (Badan Meteorologi, Klimatologi, dan Geofisika)_`;

      await sock.sendMessage(jid, { text: body }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat mengambil data peringatan cuaca. Silakan coba kembali nanti." }, { quoted: m });
    }
  }
};
