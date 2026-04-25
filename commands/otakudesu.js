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
  name: "otakudesu",
  aliases: ["otd", "anime"],
  description: "Pusat informasi anime Otakudesu. Cari, lihat detail, dan dapatkan link nonton anime favorit Anda.",
  async execute(sock, m, args, { jid, PREFIX, config, isGroup }) {
    const subCommand = args[0]?.toLowerCase();
    const query = args.slice(1).join(" ");

    const helpMessage = `📺 *OTAKUDESU ANIME CENTER*\n\n` +
      `Silakan gunakan perintah di bawah untuk menjelajah anime:\n\n` +
      `┌──────────────────────────────\n` +
      `│ 🔍 *${PREFIX}otakudesu search* <judul>\n` +
      `│ 📄 *${PREFIX}otakudesu detail* <slug>\n` +
      `│ 📺 *${PREFIX}otakudesu watch* <slug_eps>\n` +
      `└──────────────────────────────\n\n` +
      `_Pilih menu pencarian untuk memulai pengalaman menonton Anda._`;

    if (!subCommand) {
      return await sock.sendMessage(jid, { text: helpMessage }, { quoted: m });
    }

    try {
      if (subCommand === "search") {
        if (!query) return await sock.sendMessage(jid, { text: `❌ *MASUKKAN JUDUL*\n\nSilakan masukkan judul anime yang ingin Anda cari.\n*Contoh:* ${PREFIX}otakudesu search Solo Leveling` }, { quoted: m });
        
        await sock.sendMessage(jid, { text: "⏳ *MENCARI ANIME...*\n\nSedang menelusuri database Otakudesu, mohon tunggu sebentar." }, { quoted: m });
        
        const res = await api.get(`https://shivraapi.my.id/otd/search?q=${encodeURIComponent(query)}`);
        const data = res.data;

        if (!data?.meta?.status || !data?.data?.list || data.data.list.length === 0) {
          return await sock.sendMessage(jid, { text: `❌ *TIDAK DITEMUKAN*\n\nAnime dengan judul *"${query}"* tidak dapat ditemukan.` }, { quoted: m });
        }

        if (isGroup) {
          const rows = data.data.list.map((item) => ({
            title: item.title || "Tanpa Judul",
            id: `${PREFIX}otakudesu detail ${item.slug}`,
            description: `✨ Status: ${item.status || "-"} | ⭐ Rating: ${item.rating || "-"}`
          }));

          const buttonParamsJson = JSON.stringify({
            title: "Pilih Anime",
            sections: [{ title: "Hasil Pencarian", rows: rows }]
          });

          await sock.sendMessage(jid, {
            interactiveMessage: {
              title: `🔍 *HASIL PENCARIAN ANIME*\n\nBerhasil menemukan *${data.data.list.length}* judul yang relevan.`,
              body: `Silakan pilih salah satu judul di bawah untuk melihat detail lebih lanjut:`,
              footer: `© ${config.botName}`,
              buttons: [{ name: "single_select", buttonParamsJson: buttonParamsJson }]
            }
          }, { quoted: m });
        } else {
          let resultText = `🔍 *HASIL PENCARIAN ANIME*\n\n`;
          data.data.list.forEach((item, i) => {
            resultText += `${i + 1}. *${item.title || "Tanpa Judul"}*\n`;
            resultText += `   └ 🛡️ *Status:* ${item.status || "-"}\n`;
            resultText += `   └ ⭐ *Rating:* ${item.rating || "-"}\n`;
            resultText += `   └ 🆔 *Slug:* \`${item.slug}\`\n\n`;
          });
          resultText += `────────────────────\n`;
          resultText += `💡 _Ketik *${PREFIX}otakudesu detail <slug>* untuk info lengkap._`;
          await sock.sendMessage(jid, { text: resultText }, { quoted: m });
        }

      } else if (subCommand === "detail") {
        if (!query) return await sock.sendMessage(jid, { text: `❌ *MASUKKAN SLUG*\n\nSilakan masukkan slug anime yang valid!\n*Contoh:* ${PREFIX}otakudesu detail solo-leveling-sub-indo` }, { quoted: m });

        await sock.sendMessage(jid, { text: "⏳ *MEMUAT DETAIL...*\n\nSedang mengambil informasi lengkap dan daftar episode anime." }, { quoted: m });

        const res = await api.get(`https://shivraapi.my.id/otd/anime/${query}`);
        const data = res.data;

        if (!data?.meta?.status || !data?.data) {
          return await sock.sendMessage(jid, { text: `❌ *GAGAL*\n\nData anime tidak ditemukan. Pastikan slug yang Anda masukkan benar.` }, { quoted: m });
        }

        const anime = data.data;
        const genres = Array.isArray(anime.genre) ? anime.genre.map(g => g.name || g).join(", ") : (anime.genre || "-");
        
        let detailText = `🎬 *DETAIL ANIME: ${anime.title}*\n\n`;
        detailText += `🇯🇵 *Japanese:* ${anime.japanese || "-"}\n`;
        detailText += `⭐ *Skor:* ${anime.skor || "-"} / 10\n`;
        detailText += `🏢 *Studio:* ${anime.studio || "-"}\n`;
        detailText += `📡 *Status:* ${anime.status || "-"}\n`;
        detailText += `🎞️ *Total Eps:* ${anime.total_episode || "-"}\n`;
        detailText += `📅 *Rilis:* ${anime.tanggal_rilis || "-"}\n`;
        detailText += `⏱️ *Durasi:* ${anime.durasi || "-"}\n`;
        detailText += `🎭 *Genre:* ${genres}\n\n`;
        detailText += `────────────────────\n`;
        detailText += `📝 *SINOPSIS:*\n${(anime.synopsis || "-").substring(0, 600)}${anime.synopsis?.length > 600 ? "..." : ""}\n`;
        detailText += `────────────────────\n`;

        if (isGroup) {
          const episodes = anime.episode_list || [];
          const epsRows = episodes.slice(0, 50).map((eps) => {
            const title = eps.title || "Episode";
            const episodeMatch = title.match(/Episode\s*\d+/i);
            const shortTitle = episodeMatch ? episodeMatch[0] : title;
            return {
              title: `▶️ ${shortTitle}`,
              id: `${PREFIX}otakudesu watch ${eps.slug}`,
              description: title
            };
          });

          const buttonParamsJson = JSON.stringify({
            title: "Pilih Episode",
            sections: [{ title: "Daftar Episode", rows: epsRows }]
          });

          await sock.sendMessage(jid, {
            interactiveMessage: {
              image: anime.cover ? { url: anime.cover } : config.botImage,
              title: detailText,
              footer: `Silakan pilih episode di bawah untuk mulai menonton`,
              buttons: [{ name: "single_select", buttonParamsJson: buttonParamsJson }]
            }
          }, { quoted: m });
        } else {
          let epsText = detailText + `\n📺 *DAFTAR EPISODE:*\n`;
          const episodes = anime.episode_list || [];
          episodes.slice(0, 15).forEach((eps) => {
            epsText += `• ${eps.title || "Episode"}\n  └ 🆔 Slug: \`${eps.slug}\`\n`;
          });
          if (episodes.length > 15) epsText += `\n_...dan ${episodes.length - 15} episode lainnya._\n`;
          epsText += `\n────────────────────\n`;
          epsText += `💡 _Ketik *${PREFIX}otakudesu watch <slug>* untuk menonton._`;
          
          if (anime.cover) {
            await sock.sendMessage(jid, { image: { url: anime.cover }, caption: epsText }, { quoted: m });
          } else {
            await sock.sendMessage(jid, { text: epsText }, { quoted: m });
          }
        }

      } else if (subCommand === "watch") {
        if (!query) return await sock.sendMessage(jid, { text: `❌ *MASUKKAN SLUG*\n\nSilakan masukkan slug episode yang ingin ditonton!\n*Contoh:* ${PREFIX}otakudesu watch solo-leveling-episode-1-sub-indo` }, { quoted: m });

        await sock.sendMessage(jid, { text: "📺 *MENYIAPKAN PEMUTAR...*\n\nSedang mengambil tautan video dan opsi unduhan, mohon tunggu sebentar." }, { quoted: m });

        const res = await api.get(`https://shivraapi.my.id/otd/episode/${query}`);
        const data = res.data;

        if (!data?.meta?.status || !data?.data) {
          return await sock.sendMessage(jid, { text: `❌ *GAGAL*\n\nData episode tidak ditemukan atau server sedang sibuk.` }, { quoted: m });
        }

        const eps = data.data;
        const streaming = eps.defaultstreaming || "";
        let watchText = `📺 *NONTON: ${eps.title}*\n\n`;
        watchText += `📅 *Rilis:* ${eps.waktu_rilis || "-"}\n`;
        watchText += `🔗 *Streaming:* ${streaming}\n\n`;
        watchText += `────────────────────\n`;
        watchText += `💡 _*Catatan:* Jika video tidak muncul, silakan gunakan tautan streaming di atas._`;

        try {
          if (streaming.includes('.mp4') || streaming.includes('.mkv')) {
            await sock.sendMessage(jid, { video: { url: streaming }, caption: watchText }, { quoted: m });
          } else {
            await sock.sendMessage(jid, { text: watchText }, { quoted: m });
          }
        } catch (vErr) {
          await sock.sendMessage(jid, { text: watchText }, { quoted: m });
        }

        if (isGroup) {
          const downloadRows = [];
          if (eps.downloads && eps.downloads.length > 0) {
            eps.downloads.forEach(d => {
              if (d.links) {
                d.links.forEach(l => {
                  downloadRows.push({
                    title: `📥 ${d.resolution || "-"} [${l.provider || "-"}]`,
                    id: `${PREFIX}otakudesu link ${l.url}`,
                    description: `Ukuran: ${d.size || "-"}`
                  });
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

          if (eps.prev_episode?.slug) {
            buttons.push({
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "⏮️ Prev Episode",
                id: `${PREFIX}otakudesu watch ${eps.prev_episode.slug}`
              })
            });
          }

          if (eps.next_episode?.slug) {
            buttons.push({
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "Next Episode ⏭️",
                id: `${PREFIX}otakudesu watch ${eps.next_episode.slug}`
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
            let dlText = `📥 *LINK UNDUHAN ANIME:*\n\n`;
            eps.downloads.forEach(d => {
              dlText += `📦 *${d.resolution || "-"} (${d.size || "-"})*:\n`;
              if (d.links) {
                d.links.slice(0, 3).forEach(l => {
                  dlText += `• ${l.provider || "-"}: ${l.url}\n`;
                });
              }
              dlText += `\n`;
            });
            await sock.sendMessage(jid, { text: dlText }, { quoted: m });
          }
          
          let navText = `🌟 *NAVIGASI EPISODE*\n\n`;
          if (eps.prev_episode?.slug) navText += `⏮️ *Prev:* \`${PREFIX}otakudesu watch ${eps.prev_episode.slug}\`\n`;
          if (eps.next_episode?.slug) navText += `⏭️ *Next:* \`${PREFIX}otakudesu watch ${eps.next_episode.slug}\`\n`;
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
      console.error("Error in otakudesu command:", error);
      let errorMsg = "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi API Otakudesu. Silakan coba kembali nanti.";
      if (error.code === 'ECONNRESET') {
        errorMsg = "❌ *KONEKSI TERPUTUS*\n\nServer API sedang sibuk atau mengalami kendala jaringan. Mohon tunggu sebentar.";
      }
      await sock.sendMessage(jid, { text: errorMsg }, { quoted: m });
    }
  }
};
