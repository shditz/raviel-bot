module.exports = {
  name: "lahelu",
  aliases: ["meme"],
  description: "Menampilkan meme dari Lahelu atau cari meme. Gunakan: !lahelu [query] [page]",
  async execute(sock, m, args, {jid}) {
    const query = args.slice(0, -1).join(" ").trim();
    const pageInput = args[args.length - 1];
    let page = 0;
    let isSearch = false;

    // Check if last arg is a number (page) or part of query
    if (!isNaN(pageInput) && pageInput !== "") {
      page = parseInt(pageInput);
      args.pop(); // Remove page from args
    }

    try {
      let apiUrl;

      if (query) {
        // Search mode
        isSearch = true;
        apiUrl = `https://puruboy-api.vercel.app/api/search/lahelu?q=${encodeURIComponent(query)}&page=${page}`;
      } else {
        // Feed mode
        apiUrl = `https://puruboy-api.vercel.app/api/meme/lahelu?page=${page}`;
      }

      await sock.sendMessage(jid, {text: "⏳ Sedang mengambil data meme..."}, {quoted: m});

      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!data.success || !data.result || !data.result.posts || data.result.posts.length === 0) {
        const errorMsg = isSearch
          ? `❌ Meme dengan query *${query}* di halaman ${page} tidak ditemukan.`
          : `❌ Gagal mengambil meme dari Lahelu di halaman ${page}.`;
        return await sock.sendMessage(jid, {text: errorMsg}, {quoted: m});
      }

      const posts = data.result.posts.slice(0, 3); // Limit to 3 posts
      let messageIndex = 0;

      for (const post of posts) {
        let caption = `🎭 *${post.title}*\n\n`;
        caption += `👤 *User:* @${post.user}\n`;
        caption += `👍 *Upvotes:* ${post.upvotes}\n`;
        caption += `💬 *Komentar:* ${post.comments}\n`;

        if (post.tags && post.tags.length > 0) {
          caption += `🏷️ *Tags:* ${post.tags.join(", ")}\n`;
        }

        caption += `\n🔗 ${post.postUrl}`;

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
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      let infoMsg = `✅ Berhasil menampilkan ${posts.length} meme (Halaman: ${page})`;
      if (isSearch) {
        infoMsg += ` untuk query: *${query}*`;
      }

      // Show pagination info
      if (data.result.hasMore) {
        infoMsg += `\n\n📄 Gunakan: *${require("../config").prefix}lahelu`;
        if (isSearch) {
          infoMsg += ` ${query}`;
        }
        infoMsg += ` ${page + 1}* untuk halaman berikutnya.`;
      } else {
        infoMsg += `\n\n📄 Ini adalah halaman terakhir.`;
      }

      infoMsg += `\n\n💡 Halaman dimulai dari 0. Contoh: *${require("../config").prefix}lahelu 0*`;

      await sock.sendMessage(jid, {text: infoMsg}, {quoted: m});
    } catch (error) {
      console.error("Error in lahelu command:", error);
      return await sock.sendMessage(
        jid,
        {text: "❌ Terjadi kesalahan saat mengambil meme. Coba lagi nanti."},
        {quoted: m},
      );
    }
  },
};
