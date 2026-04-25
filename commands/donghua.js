const axios = require("axios");

const api = axios.create({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  }
});

module.exports = {
  name: "donghua",
  aliases: ["dnh"],
  description: "Pusat informasi Donghua (Anime China). Cari, lihat detail, dan dapatkan link nonton donghua favorit Anda.",
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

    const helpMessage = `🐲 *DONGHUA CENTER*\n\n` +
      `Silakan gunakan perintah di bawah untuk menjelajah donghua:\n\n` +
      `┌──────────────────────────────\n` +
      `│ 🔍 *${PREFIX}donghua search* <judul>\n` +
      `│ 📄 *${PREFIX}donghua detail* <slug>\n` +
      `│ 📺 *${PREFIX}donghua watch* <slug_eps>\n` +
      `└──────────────────────────────\n\n` +
      `_Pilih menu pencarian untuk memulai pengalaman menonton Anda._`;

    if (!subCommand) {
      return await sock.sendMessage(jid, { text: helpMessage }, { quoted: m });
    }

    try {
      if (subCommand === "search") {
        if (!query) return await sock.sendMessage(jid, { text: `❌ *MASUKKAN JUDUL*\n\nSilakan masukkan judul donghua yang ingin Anda cari.\n*Contoh:* ${PREFIX}donghua search Soul Land` }, { quoted: m });
        
        await sock.sendMessage(jid, { text: `⏳ *MENCARI DONGHUA...*\n\nSedang menelusuri database Donghua "${query}" (Halaman: ${page}).` }, { quoted: m });
        
        const res = await api.get(`https://shivraapi.my.id/dnh/search?q=${encodeURIComponent(query)}&page=${page}`);
        const data = res.data;

        if (!data?.meta?.status || !data?.data?.list || data.data.list.length === 0) {
          return await sock.sendMessage(jid, { text: `❌ *TIDAK DITEMUKAN*\n\nDonghua dengan judul *"${query}"* tidak dapat ditemukan.` }, { quoted: m });
        }

        const pagination = data.data.pagination || {};

        if (isGroup) {
          const rows = data.data.list.map((item) => ({
            title: item.title || "Tanpa Judul",
            id: `${PREFIX}donghua detail ${item.slug}`,
            description: `✨ Type: ${item.type || "-"} | 🛡️ Status: ${item.status || "-"}`
          }));

          const buttons = [{ name: "single_select", buttonParamsJson: JSON.stringify({
            title: "Pilih Donghua",
            sections: [{ title: "Hasil Pencarian", rows: rows }]
          }) }];

          if (pagination.has_prev) {
            buttons.push({
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "⏮️ Halaman Seb",
                id: `${PREFIX}donghua search ${query} -page=${page - 1}`
              })
            });
          }

          if (pagination.has_next) {
            buttons.push({
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "Halaman Ber ⏭️",
                id: `${PREFIX}donghua search ${query} -page=${page + 1}`
              })
            });
          }

          await sock.sendMessage(jid, {
            interactiveMessage: {
              title: `🔍 *HASIL PENCARIAN DONGHUA*\n\nBerhasil menemukan *${data.data.list.length}* donghua (Halaman ${page}/${pagination.total_pages || "?"}).`,
              body: `Silakan pilih salah satu judul di bawah untuk melihat detail lebih lanjut:`,
              footer: `© ${config.botName}`,
              buttons: buttons
            }
          }, { quoted: m });
        } else {
          let resultText = `🔍 *HASIL PENCARIAN DONGHUA*\n\n`;
          resultText += `📑 *Halaman:* ${page} / ${pagination.total_pages || "?"}\n`;
          resultText += `────────────────────\n\n`;
          data.data.list.forEach((item, i) => {
            resultText += `${i + 1}. *${item.title || "Tanpa Judul"}*\n`;
            resultText += `   └ 🛡️ *Status:* ${item.status || "-"}\n`;
            resultText += `   └ ✨ *Tipe:* ${item.type || "-"}\n`;
            resultText += `   └ 🆔 *Slug:* \`${item.slug}\`\n\n`;
          });
          
          if (pagination.has_prev) resultText += `⏮️ *Kembali:* \`${PREFIX}donghua search ${query} -page=${page - 1}\`\n`;
          if (pagination.has_next) resultText += `⏭️ *Lanjut:* \`${PREFIX}donghua search ${query} -page=${page + 1}\`\n`;
          
          resultText += `\n────────────────────\n`;
          resultText += `💡 _Ketik *${PREFIX}donghua detail <slug>* untuk info lengkap._`;
          await sock.sendMessage(jid, { text: resultText }, { quoted: m });
        }

      } else if (subCommand === "detail") {
        if (!query) return await sock.sendMessage(jid, { text: `❌ *MASUKKAN SLUG*\n\nSilakan masukkan slug donghua yang valid!\n*Contoh:* ${PREFIX}donghua detail soul-land` }, { quoted: m });

        await sock.sendMessage(jid, { text: "⏳ *MEMUAT DETAIL...*\n\nSedang mengambil informasi lengkap dan daftar episode donghua." }, { quoted: m });

        const res = await api.get(`https://shivraapi.my.id/dnh/detail/${query}`);
        const data = res.data;

        if (!data?.meta?.status || !data?.data) {
          return await sock.sendMessage(jid, { text: `❌ *GAGAL*\n\nData donghua tidak ditemukan. Pastikan slug yang Anda masukkan benar.` }, { quoted: m });
        }

        const dnh = data.data;
        const genres = Array.isArray(dnh.genres) ? dnh.genres.map(g => g.name || g).join(", ") : "-";
        
        let detailText = `🐲 *DETAIL DONGHUA: ${dnh.title}*\n\n`;
        detailText += `🇯🇵 *Alt Title:* ${dnh.alt_title || "-"}\n`;
        detailText += `⭐ *Rating:* ${dnh.rating || "-"}\n`;
        detailText += `🏢 *Studio:* ${dnh.studio?.text || "-"}\n`;
        detailText += `📡 *Status:* ${dnh.status || "-"}\n`;
        detailText += `🎞️ *Total Eps:* ${dnh.total_episodes || "-"}\n`;
        detailText += `📅 *Rilis:* ${dnh.released || "-"}\n`;
        detailText += `⏱️ *Durasi:* ${dnh.duration || "-"}\n`;
        detailText += `📺 *Season:* ${dnh.season?.text || "-"}\n`;
        detailText += `🎭 *Genre:* ${genres}\n\n`;
        detailText += `────────────────────\n`;
        detailText += `📝 *SINOPSIS:*\n${(dnh.synopsis || "-").substring(0, 600)}${dnh.synopsis?.length > 600 ? "..." : ""}\n`;
        detailText += `────────────────────\n`;

        if (isGroup) {
          const episodes = dnh.episodes || [];
          const epsRows = episodes.slice(0, 50).map((eps) => ({
            title: `▶️ ${eps.episode || "Episode"}`,
            id: `${PREFIX}donghua watch ${eps.slug}`,
            description: eps.title || eps.episode
          }));

          const buttonParamsJson = JSON.stringify({
            title: "Pilih Episode",
            sections: [{ title: "Daftar Episode", rows: epsRows }]
          });

          await sock.sendMessage(jid, {
            interactiveMessage: {
              image: dnh.cover ? { url: dnh.cover } : config.botImage,
              title: detailText,
              footer: `Silakan pilih episode di bawah untuk mulai menonton`,
              buttons: [{ name: "single_select", buttonParamsJson: buttonParamsJson }]
            }
          }, { quoted: m });
        } else {
          let epsText = detailText + `\n📺 *DAFTAR EPISODE:*\n`;
          const episodes = dnh.episodes || [];
          episodes.slice(0, 15).forEach((eps) => {
            epsText += `• ${eps.episode || "Episode"}: ${eps.title || ""}\n  └ 🆔 Slug: \`${eps.slug}\`\n`;
          });
          if (episodes.length > 15) epsText += `\n_...dan ${episodes.length - 15} episode lainnya._\n`;
          epsText += `\n────────────────────\n`;
          epsText += `💡 _Ketik *${PREFIX}donghua watch <slug>* untuk menonton._`;
          
          if (dnh.cover) {
            await sock.sendMessage(jid, { image: { url: dnh.cover }, caption: epsText }, { quoted: m });
          } else {
            await sock.sendMessage(jid, { text: epsText }, { quoted: m });
          }
        }

      } else if (subCommand === "watch") {
        if (!query) return await sock.sendMessage(jid, { text: `❌ *MASUKKAN SLUG*\n\nSilakan masukkan slug episode yang ingin ditonton!\n*Contoh:* ${PREFIX}donghua watch soul-land-episode-260` }, { quoted: m });

        await sock.sendMessage(jid, { text: "📺 *MENYIAPKAN PEMUTAR...*\n\nSedang mengambil tautan video dan opsi unduhan donghua." }, { quoted: m });

        const res = await api.get(`https://shivraapi.my.id/dnh/episode/${query}`);
        const data = res.data;

        if (!data?.meta?.status || !data?.data) {
          return await sock.sendMessage(jid, { text: `❌ *GAGAL*\n\nData episode tidak ditemukan atau server sedang sibuk.` }, { quoted: m });
        }

        const eps = data.data;
        const nav = eps.navigation || {};
        const servers = eps.servers || [];
        const streaming = servers.length > 0 ? servers[0].src : "";

        let watchText = `📺 *NONTON DONGHUA: ${eps.title}*\n\n`;
        watchText += `📅 *Rilis:* ${eps.release_date || "-"}\n`;
        watchText += `🔗 *Streaming:* ${streaming}\n\n`;
        watchText += `────────────────────\n`;
        watchText += `💡 _*Catatan:* Jika video tidak muncul, silakan gunakan tautan streaming di atas._`;

        await sock.sendMessage(jid, { text: watchText }, { quoted: m });

        if (isGroup) {
          const downloadRows = [];
          if (eps.downloads && eps.downloads.length > 0) {
            eps.downloads.forEach(d => {
              if (d.links) {
                d.links.forEach(q => {
                  if (q.providers) {
                    q.providers.forEach(p => {
                      downloadRows.push({
                        title: `📥 ${q.quality || "-"} [${p.name || "-"}]`,
                        id: `${PREFIX}donghua link ${p.link}`,
                        description: d.title || ""
                      });
                    });
                  }
                });
              }
            });
          }

          const buttons = [];
          if (downloadRows.length > 0) {
            buttons.push({
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                title: "Opsi Download",
                sections: [{ title: "Resolusi & Provider", rows: downloadRows.slice(0, 50) }]
              })
            });
          }

          if (nav.prev) {
            const prevSlug = nav.prev.split('/').pop();
            buttons.push({
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "⏮️ Prev Episode",
                id: `${PREFIX}donghua watch ${prevSlug}`
              })
            });
          }

          if (nav.next) {
            const nextSlug = nav.next.split('/').pop();
            buttons.push({
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "Next Episode ⏭️",
                id: `${PREFIX}donghua watch ${nextSlug}`
              })
            });
          }

          if (buttons.length > 0) {
            await sock.sendMessage(jid, {
              interactiveMessage: {
                title: `✨ *MENU EPISODE: ${eps.title}*`,
                footer: `© ${config.botName}`,
                buttons: buttons
              }
            }, { quoted: m });
          }
        } else {
          if (eps.downloads && eps.downloads.length > 0) {
            let dlText = `📥 *LINK UNDUHAN DONGHUA:*\n\n`;
            eps.downloads.slice(0, 5).forEach(d => {
              dlText += `📦 *${d.title}*:\n`;
              if (d.links) {
                d.links.slice(0, 2).forEach(q => {
                    dlText += ` • ${q.quality}: `;
                    q.providers.slice(0, 2).forEach(p => dlText += `${p.name} | `);
                    dlText += `\n`;
                });
              }
              dlText += `\n`;
            });
            await sock.sendMessage(jid, { text: dlText }, { quoted: m });
          }
          
          let navText = `🌟 *NAVIGASI EPISODE*\n\n`;
          if (nav.prev) navText += `⏮️ *Prev:* \`${PREFIX}donghua watch ${nav.prev.split('/').pop()}\`\n`;
          if (nav.next) navText += `⏭️ *Next:* \`${PREFIX}donghua watch ${nav.next.split('/').pop()}\`\n`;
          if (navText.trim() !== "🌟 *NAVIGASI EPISODE*") await sock.sendMessage(jid, { text: navText }, { quoted: m });
        }

      } else if (subCommand === "link") {
        const link = args.slice(1).join(" ");
        if (!link) return;
        await sock.sendMessage(jid, { text: `🔗 *LINK DOWNLOAD:*\n\n${link}` }, { quoted: m });

      } else {
        await sock.sendMessage(jid, { text: helpMessage }, { quoted: m });
      }

    } catch (error) {
      console.error("Error in donghua command:", error);
      let errorMsg = "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi API Donghua. Silakan coba kembali nanti.";
      if (error.code === 'ECONNRESET') {
        errorMsg = "❌ *KONEKSI TERPUTUS*\n\nServer API sedang sibuk atau mengalami kendala jaringan. Mohon tunggu sebentar.";
      }
      await sock.sendMessage(jid, { text: errorMsg }, { quoted: m });
    }
  }
};
