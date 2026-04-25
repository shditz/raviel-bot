const axios = require("axios");

const api = axios.create({
  timeout: 20000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  }
});

module.exports = {
  name: "novel",
  aliases: ["nvl", "bacanovel"],
  description: "Perpustakaan novel digital Raviel. Cari, lihat detail, dan baca novel favorit Anda secara langsung.",
  async execute(sock, m, args, { jid, PREFIX, config, isGroup }) {
    const subCommand = args[0]?.toLowerCase();
    
    let fullQuery = args.slice(1).join(" ");
    let page = 1;
    let query = fullQuery;
    
    if (fullQuery.includes("-page=")) {
      const parts = fullQuery.split("-page=");
      query = parts[0].trim();
      page = parseInt(parts[1]) || 1;
    }

    const helpMessage = `📖 *RAVIEL NOVEL LIBRARY*\n\n` +
      `Silakan gunakan perintah di bawah untuk menjelajah novel:\n\n` +
      `┌──────────────────────────────\n` +
      `│ 🔍 *${PREFIX}novel search* <judul>\n` +
      `│ 📄 *${PREFIX}novel detail* <slug>\n` +
      `│ 📖 *${PREFIX}novel read* <slug_chapter>\n` +
      `└──────────────────────────────\n\n` +
      `_Pilih menu pencarian untuk memulai pengalaman membaca Anda._`;

    if (!subCommand) {
      return await sock.sendMessage(jid, { text: helpMessage }, { quoted: m });
    }

    try {
      if (subCommand === "search") {
        if (!query) return await sock.sendMessage(jid, { text: `❌ *MASUKKAN JUDUL*\n\nSilakan masukkan judul novel yang ingin Anda cari.\n*Contoh:* ${PREFIX}novel search Solo Leveling` }, { quoted: m });
        
        await sock.sendMessage(jid, { text: `⏳ *MENCARI NOVEL...*\n\nSedang menelusuri perpustakaan novel "${query}" (Halaman: ${page}).` }, { quoted: m });
        
        const res = await api.get(`https://shivraapi.my.id/nvl/search?q=${encodeURIComponent(query)}&page=${page}`);
        const data = res.data;

        if (!data?.meta?.status || !data?.data?.list || data.data.list.length === 0) {
          return await sock.sendMessage(jid, { text: `❌ *TIDAK DITEMUKAN*\n\nNovel dengan judul *"${query}"* tidak dapat ditemukan.` }, { quoted: m });
        }

        const pagination = data.data.pagination || {};

        if (isGroup) {
          const rows = data.data.list.map((item) => {
            const genres = Array.isArray(item.genre) ? item.genre.slice(0, 2).join(", ") : (item.genre || "-");
            return {
              title: item.title || "Tanpa Judul",
              id: `${PREFIX}novel detail ${item.slug}`,
              description: `👤 Penulis: ${item.author || "-"} | 🎭 Genre: ${genres}`
            };
          });

          const buttons = [{ name: "single_select", buttonParamsJson: JSON.stringify({
            title: "Pilih Novel",
            sections: [{ title: "Hasil Pencarian", rows: rows }]
          }) }];

          if (pagination.has_prev) {
            buttons.push({
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "⏮️ Halaman Seb",
                id: `${PREFIX}novel search ${query} -page=${page - 1}`
              })
            });
          }

          if (pagination.has_next) {
            buttons.push({
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "Halaman Ber ⏭️",
                id: `${PREFIX}novel search ${query} -page=${page + 1}`
              })
            });
          }

          await sock.sendMessage(jid, {
            interactiveMessage: {
              title: `🔍 *HASIL PENCARIAN NOVEL*\n\nBerhasil menemukan *${data.data.list.length}* novel (Halaman ${page}/${pagination.total_pages || "?"}).`,
              body: `Silakan pilih salah satu judul di bawah untuk melihat detail lebih lanjut:`,
              footer: `© ${config.botName}`,
              buttons: buttons
            }
          }, { quoted: m });
        } else {
          let resultText = `🔍 *HASIL PENCARIAN NOVEL*\n\n`;
          resultText += `📑 *Halaman:* ${page} / ${pagination.total_pages || "?"}\n`;
          resultText += `────────────────────\n\n`;
          data.data.list.forEach((item, i) => {
            resultText += `${i + 1}. *${item.title || "Tanpa Judul"}*\n`;
            resultText += `   └ 👤 *Penulis:* ${item.author || "-"}\n`;
            resultText += `   └ 🆔 *Slug:* \`${item.slug}\`\n\n`;
          });

          if (pagination.has_prev) resultText += `⏮️ *Kembali:* \`${PREFIX}novel search ${query} -page=${page - 1}\`\n`;
          if (pagination.has_next) resultText += `⏭️ *Lanjut:* \`${PREFIX}novel search ${query} -page=${page + 1}\`\n`;
          
          resultText += `\n────────────────────\n`;
          resultText += `💡 _Ketik *${PREFIX}novel detail <slug>* untuk info lengkap._`;
          await sock.sendMessage(jid, { text: resultText }, { quoted: m });
        }

      } else if (subCommand === "detail") {
        if (!query) return await sock.sendMessage(jid, { text: `❌ *MASUKKAN SLUG*\n\nSilakan masukkan slug novel yang valid!\n*Contoh:* ${PREFIX}novel detail solo-leveling` }, { quoted: m });

        await sock.sendMessage(jid, { text: "⏳ *MEMUAT DETAIL...*\n\nSedang mengambil informasi lengkap dan daftar chapter novel." }, { quoted: m });

        const res = await api.get(`https://shivraapi.my.id/nvl/detail/${query}`);
        const data = res.data;

        if (!data?.meta?.status || !data?.data) {
          return await sock.sendMessage(jid, { text: `❌ *GAGAL*\n\nData novel tidak ditemukan. Pastikan slug yang Anda masukkan benar.` }, { quoted: m });
        }

        const novel = data.data;
        const genres = Array.isArray(novel.genre) ? novel.genre.join(", ") : (novel.genre || "-");
        
        const title = novel.title || "-";
        const author = novel.penulis || novel.author || "-";
        const status = novel.status || "-";
        const score = novel.score || "-";
        const release = novel.date || novel.release_year || "-";
        const synopsis = (novel.sinopsis || novel.synopsis || "-");

        let detailText = `📄 *DETAIL NOVEL: ${title}*\n\n`;
        detailText += `👤 *Penulis:* ${author}\n`;
        detailText += `⭐ *Skor:* ${score}\n`;
        detailText += `📡 *Status:* ${status}\n`;
        detailText += `📅 *Rilis:* ${release}\n`;
        detailText += `🎭 *Genre:* ${genres}\n\n`;
        detailText += `────────────────────\n`;
        detailText += `📝 *SINOPSIS:*\n${synopsis.substring(0, 600)}${synopsis.length > 600 ? "..." : ""}\n`;
        detailText += `────────────────────\n`;

        if (isGroup) {
          const chapters = novel["daftar chapter"] || novel.list_chapter || [];
          const chRows = chapters.slice(0, 50).map((ch) => {
            const chTitle = typeof ch === 'string' ? ch : (ch.title || "Chapter");
            const chSlug = typeof ch === 'string' ? ch.split('/').pop() : (ch.slug || "");
            
            return {
              title: `📖 ${chTitle}`,
              id: `${PREFIX}novel read ${chSlug}`,
              description: chTitle
            };
          });

          const buttonParamsJson = JSON.stringify({
            title: "Pilih Chapter",
            sections: [{ title: "Daftar Chapter", rows: chRows }]
          });

          await sock.sendMessage(jid, {
            interactiveMessage: {
              image: novel.cover ? { url: novel.cover } : config.botImage,
              title: detailText,
              footer: `Silakan pilih chapter di bawah untuk mulai membaca`,
              buttons: [{ name: "single_select", buttonParamsJson: buttonParamsJson }]
            }
          }, { quoted: m });
        } else {
          let detailMsg = detailText + `\n📖 *DAFTAR CHAPTER:*\n`;
          const chapters = novel["daftar chapter"] || novel.list_chapter || [];
          chapters.slice(0, 15).forEach((ch) => {
            const chTitle = typeof ch === 'string' ? ch : (ch.title || "Chapter");
            const chSlug = typeof ch === 'string' ? ch.split('/').pop() : (ch.slug || "");
            detailMsg += `• ${chTitle}\n  └ 🆔 Slug: \`${chSlug}\`\n`;
          });
          if (chapters.length > 15) detailMsg += `\n_...dan ${chapters.length - 15} chapter lainnya._\n`;
          detailMsg += `\n────────────────────\n`;
          detailMsg += `💡 _Ketik *${PREFIX}novel read <slug>* untuk membaca._`;
          
          if (novel.cover) {
            await sock.sendMessage(jid, { image: { url: novel.cover }, caption: detailMsg }, { quoted: m });
          } else {
            await sock.sendMessage(jid, { text: detailMsg }, { quoted: m });
          }
        }

      } else if (subCommand === "read") {
        if (!query) return await sock.sendMessage(jid, { text: `❌ *MASUKKAN SLUG*\n\nSilakan masukkan slug chapter yang ingin dibaca!\n*Contoh:* ${PREFIX}novel read solo-leveling-chapter-1` }, { quoted: m });

        await sock.sendMessage(jid, { text: "📖 *MEMBUKA CHAPTER...*\n\nSedang menyiapkan konten bacaan, mohon tunggu sebentar." }, { quoted: m });

        const res = await api.get(`https://shivraapi.my.id/nvl/read/${query}`);
        const data = res.data;

        if (!data?.meta?.status || !data?.data) {
          return await sock.sendMessage(jid, { text: `❌ *GAGAL*\n\nData chapter tidak ditemukan atau server sedang sibuk.` }, { quoted: m });
        }

        const chapter = data.data;
        const nav = chapter.navigation || {};
        const content = chapter.content || "";
        
        let readText = `📖 *MEMBACA: ${chapter.title || "Chapter"}*\n`;
        readText += `📅 *Update:* ${chapter.date || "-"}\n`;
        readText += `────────────────────\n\n`;
        readText += content.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>?/gm, ''); 

        if (readText.length > 4000) {
            const parts = readText.match(/[\s\S]{1,4000}/g) || [];
            for (let i = 0; i < parts.length; i++) {
                await sock.sendMessage(jid, { text: parts[i] }, { quoted: i === 0 ? m : null });
            }
        } else {
            await sock.sendMessage(jid, { text: readText }, { quoted: m });
        }

        if (isGroup) {
          const buttons = [];
          if (nav.prev?.slug) {
            buttons.push({
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "⏮️ Prev Chapter",
                id: `${PREFIX}novel read ${nav.prev.slug}`
              })
            });
          }

          if (nav.next?.slug) {
            buttons.push({
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "Next Chapter ⏭️",
                id: `${PREFIX}novel read ${nav.next.slug}`
              })
            });
          }
          
          if (nav.series?.slug) {
            buttons.push({
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "📚 List Chapter",
                id: `${PREFIX}novel detail ${nav.series.slug}`
              })
            });
          }

          if (buttons.length > 0) {
            await sock.sendMessage(jid, {
              interactiveMessage: {
                title: `✨ *NAVIGASI READING*`,
                footer: `© ${config.botName}`,
                buttons: buttons
              }
            }, { quoted: m });
          }
        } else {
          let navText = `🌟 *NAVIGASI READING*\n\n`;
          if (nav.prev?.slug) navText += `⏮️ *Prev:* \`${PREFIX}novel read ${nav.prev.slug}\`\n`;
          if (nav.next?.slug) navText += `⏭️ *Next:* \`${PREFIX}novel read ${nav.next.slug}\`\n`;
          if (nav.series?.slug) navText += `📚 *Daftar:* \`${PREFIX}novel detail ${nav.series.slug}\`\n`;
          if (navText.trim() !== "🌟 *NAVIGASI READING*") await sock.sendMessage(jid, { text: navText }, { quoted: m });
        }

      } else {
        await sock.sendMessage(jid, { text: helpMessage }, { quoted: m });
      }

    } catch (error) {
      console.error("Error in novel command:", error);
      let errorMsg = "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi API Novel. Silakan coba kembali nanti.";
      if (error.code === 'ECONNRESET') {
        errorMsg = "❌ *KONEKSI TERPUTUS*\n\nServer API sedang sibuk atau mengalami kendala jaringan. Mohon tunggu sebentar.";
      }
      await sock.sendMessage(jid, { text: errorMsg }, { quoted: m });
    }
  }
};
