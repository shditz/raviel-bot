module.exports = {
  name: "pinterest",
  aliases: ["pin"],
  description: "Mencari gambar dari Pinterest. Gunakan: !pinterest <query>",
  async execute(sock, m, args, {jid}) {
    const query = args.join(" ").trim();
    if (!query) {
      return await sock.sendMessage(
        jid,
        {text: "❌ Masukkan query pencarian! Contoh: !pinterest Anime Wallpaper"},
        {quoted: m},
      );
    }

    try {
      await sock.sendMessage(jid, {text: "⏳ Sedang mencari gambar di Pinterest..."}, {quoted: m});

      const apiUrl = `https://puruboy-api.vercel.app/api/search/pinterest?q=${encodeURIComponent(query)}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!data.success || !data.result || data.result.length === 0) {
        return await sock.sendMessage(
          jid,
          {text: `❌ Gambar dengan query *${query}* tidak ditemukan di Pinterest.`},
          {quoted: m},
        );
      }

      // Send first 5 images
      const results = data.result.slice(0, 5);

      for (let i = 0; i < results.length; i++) {
        const pin = results[i];
        let caption = `🖼️ *PINTEREST - HASIL ${i + 1}*\n\n`;
        caption += `📌 *Judul:* ${pin.title || "Tidak ada judul"}\n`;
        caption += `👤 *Pengguna:* ${pin.pinner.fullName || pin.pinner.username}\n`;
        caption += `🔗 *Link:* ${pin.pin_url}\n`;

        await sock.sendMessage(jid, {
          image: {url: pin.image},
          caption: caption,
        });

        // Add delay between messages to avoid rate limiting
        if (i < results.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      await sock.sendMessage(
        jid,
        {
          text: `✅ Berhasil menampilkan ${results.length} hasil dari Pinterest untuk query: *${query}*`,
        },
        {quoted: m},
      );
    } catch (error) {
      console.error("Error in pinterest command:", error);
      return await sock.sendMessage(
        jid,
        {text: "❌ Terjadi kesalahan saat mencari gambar. Coba lagi nanti."},
        {quoted: m},
      );
    }
  },
};
