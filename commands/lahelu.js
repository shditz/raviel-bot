module.exports = {
  name: "lahelu",
  aliases: ["meme"],
  description: "Menampilkan kumpulan meme lucu dan video hiburan dari platform Lahelu.",
  async execute(sock, m, args, {jid}) {
    const config = require("../config");
    const query = args.slice(0, -1).join(" ").trim();
    const pageInput = args[args.length - 1];
    let page = 0;
    let isSearch = false;

    if (!isNaN(pageInput) && pageInput !== "" && args.length > 0) {
      page = parseInt(pageInput);
      args.pop();
    }

    try {
      let apiUrl;

      if (query) {
        isSearch = true;
        apiUrl = `https://puruboy-api.vercel.app/api/search/lahelu?q=${encodeURIComponent(query)}&page=${page}`;
      } else {
        apiUrl = `https://puruboy-api.vercel.app/api/meme/lahelu?page=${page}`;
      }

      await sock.sendMessage(jid, {text: "⏳ *MENGAMBIL MEME...*\n\nSedang mengumpulkan meme terlucu untuk Anda, mohon tunggu sebentar."}, {quoted: m});

      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!data.success || !data.result || !data.result.posts || data.result.posts.length === 0) {
        const errorMsg = isSearch
          ? `❌ *TIDAK DITEMUKAN*\n\nMeme dengan kata kunci *${query}* pada halaman ${page} tidak ditemukan.`
          : `❌ *GAGAL*\n\nMaaf, sistem gagal memuat meme dari Lahelu pada halaman ${page} saat ini.`;
        return await sock.sendMessage(jid, {text: errorMsg}, {quoted: m});
      }

      const posts = data.result.posts.slice(0, 3);
      let messageIndex = 0;

      for (const post of posts) {
        let caption = `🎭 *LAHELU MEME*\n\n`;
        caption += `📌 *Judul:* ${post.title}\n`;
        caption += `👤 *User:* @${post.user}\n`;
        caption += `👍 *Upvotes:* ${post.upvotes}\n`;
        caption += `💬 *Komentar:* ${post.comments}\n`;

        if (post.tags && post.tags.length > 0) {
          caption += `🏷️ *Tags:* ${post.tags.join(", ")}\n`;
        }

        caption += `\n────────────────────\n`;
        caption += `🔗 *Link:* ${post.postUrl}`;

        if (post.mediaType === "image") {
          await sock.sendMessage(jid, {
            image: {url: post.media},
            caption: caption,
          });
        } else if (post.mediaType === "video") {
          await sock.sendMessage(jid, {
            video: {url: post.media},
            caption: caption,
          });
        }

        messageIndex++;
        if (messageIndex < posts.length) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }

      let infoMsg = `✅ *PENCARIAN SELESAI*\n\nBerhasil menampilkan ${posts.length} meme (Halaman: ${page})`;
      if (isSearch) {
        infoMsg += ` untuk: *${query}*`;
      }

      if (data.result.hasMore) {
        infoMsg += `\n\n📄 *Lanjut:* Ketik *${config.prefix}lahelu`;
        if (isSearch) {
          infoMsg += ` ${query}`;
        }
        infoMsg += ` ${page + 1}* untuk melihat halaman berikutnya.`;
      } else {
        infoMsg += `\n\n📄 _Ini adalah halaman terakhir._`;
      }

      await sock.sendMessage(jid, {text: infoMsg}, {quoted: m});
    } catch (error) {
      console.error("Error in lahelu command:", error);
      return await sock.sendMessage(
        jid,
        {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat mengambil meme. Silakan coba kembali nanti."},
        {quoted: m},
      );
    }
  },
};
