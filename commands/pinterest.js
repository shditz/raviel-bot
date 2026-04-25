module.exports = {
  name: "pinterest",
  aliases: ["pin"],
  description: "Mencari inspirasi gambar menarik dari platform Pinterest.",
  async execute(sock, m, args, {jid}) {
    const query = args.join(" ").trim();
    if (!query) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *MASUKKAN QUERY*\n\nSilakan masukkan kata kunci gambar yang ingin Anda cari!\n*Contoh:* !pinterest Anime Wallpaper"},
        {quoted: m},
      );
    }

    try {
      await sock.sendMessage(jid, {text: "⏳ *MENCARI...*\n\nSedang mengumpulkan gambar terbaik dari Pinterest, mohon tunggu sebentar."}, {quoted: m});

      const apiUrl = `https://puruboy-api.vercel.app/api/search/pinterest?q=${encodeURIComponent(query)}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!data.success || !data.result || data.result.length === 0) {
        return await sock.sendMessage(
          jid,
          {text: `❌ *TIDAK DITEMUKAN*\n\nGambar dengan kata kunci *${query}* tidak dapat ditemukan di Pinterest.`},
          {quoted: m},
        );
      }

      const results = data.result.slice(0, 5);

      for (let i = 0; i < results.length; i++) {
        const pin = results[i];
        let caption = `🖼️ *PINTEREST RESULT [${i + 1}/${results.length}]*\n\n`;
        caption += `📌 *Judul:* ${pin.title || "Inspirasi Gambar"}\n`;
        caption += `👤 *Oleh:* ${pin.pinner.fullName || pin.pinner.username}\n`;
        caption += `────────────────────\n`;
        caption += `🔗 *Link:* ${pin.pin_url}`;

        await sock.sendMessage(jid, {
          image: {url: pin.image},
          caption: caption,
        });

        if (i < results.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }

      await sock.sendMessage(
        jid,
        {
          text: `✅ *BERHASIL*\n\nMenampilkan ${results.length} gambar terbaik dari Pinterest untuk: *${query}*`,
        },
        {quoted: m},
      );
    } catch (error) {
      console.error("Error in pinterest command:", error);
      return await sock.sendMessage(
        jid,
        {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat mencari gambar. Silakan coba kembali nanti."},
        {quoted: m},
      );
    }
  },
};
