const config = require("../config");
const {getBotMode, setBotMode} = require("../database/db");

module.exports = {
  name: "botmode",
  description: "Mengatur mode operasional bot (Grup Only atau Grup + DM).",
  async execute(sock, m, args, {jid, sender}) {
    if (sender !== `${config.ownerNumber}@s.whatsapp.net`) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *AKSES DITOLAK*\n\nMaaf, hanya Pemilik Bot (Owner) yang memiliki wewenang untuk mengakses pengaturan sistem ini!"},
        {quoted: m},
      );
    }

    const subcommand = (args[0] || "info").toLowerCase();

    try {
      if (subcommand === "group") {
        setBotMode("group");
        return await sock.sendMessage(
          jid,
          {
            text:
              "✅ *PENGATURAN DIPERBARUI*\n\n" +
              "Bot kini beroperasi dalam mode: *GRUP SAJA*\n" +
              "Seluruh pesan dari chat pribadi akan diabaikan demi efisiensi sistem.",
          },
          {quoted: m},
        );
      }

      if (subcommand === "all") {
        setBotMode("all");
        return await sock.sendMessage(
          jid,
          {
            text:
              "✅ *PENGATURAN DIPERBARUI*\n\n" + 
              "Bot kini beroperasi dalam mode: *SEMUA (GRUP & DM)*\n" +
              "Bot akan merespons perintah baik di dalam grup maupun chat pribadi.",
          },
          {quoted: m},
        );
      }

      if (subcommand === "info") {
        const currentMode = getBotMode();
        const modeText =
          currentMode === "group" ? "🔴 GRUP SAJA" : "🟢 GRUP + DM PRIBADI";
        const description =
          currentMode === "group"
            ? "Bot saat ini hanya aktif di dalam lingkungan grup."
            : "Bot aktif sepenuhnya di grup maupun chat pribadi.";

        return await sock.sendMessage(
          jid,
          {
            text:
              `⚙️ *KONFIGURASI BOT*\n` +
              `────────────────────\n` +
              `💠 *Mode Operasi:* ${modeText}\n` +
              `📝 *Deskripsi:* ${description}\n` +
              `────────────────────\n` +
              `🛠️ *Ubah Konfigurasi:*\n` +
              `• \`!botmode group\` - (Grup Saja)\n` +
              `• \`!botmode all\` - (Grup & DM)`,
          },
          {quoted: m},
        );
      }

      return await sock.sendMessage(
        jid,
        {
          text:
            `❓ *PERINTAH TIDAK DIKENAL*\n\n` +
            `Gunakan salah satu opsi berikut:\n` +
            `────────────────────\n` +
            `• *!botmode all*   : Mode Grup & DM\n` +
            `• *!botmode group* : Mode Grup Saja\n` +
            `• *!botmode info*  : Cek Mode Saat Ini`,
        },
        {quoted: m},
      );
    } catch (err) {
      console.error("Error pada command botmode:", err);
      return await sock.sendMessage(
        jid,
        {text: `❌ *KESALAHAN SISTEM*\n\nGagal memperbarui konfigurasi: ${err.message}`},
        {quoted: m},
      );
    }
  },
};
