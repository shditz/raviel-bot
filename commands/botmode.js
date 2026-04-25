const config = require("../config");
const {getBotMode, setBotMode} = require("../database/db");

module.exports = {
  name: "botmode",
  description: "Mengatur mode bot (grup saja atau grup + DM pribadi).",
  async execute(sock, m, args, {jid, sender}) {
    // Cek apakah pengguna adalah owner
    if (sender !== `${config.ownerNumber}@s.whatsapp.net`) {
      return await sock.sendMessage(
        jid,
        {text: "❌ Hanya owner yang bisa menggunakan command ini!"},
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
              "✅ *Mode Bot Diubah!*\n\n" +
              "Bot sekarang hanya merespons di **GRUP SAJA**.\n" +
              "Chat pribadi akan diabaikan sepenuhnya.",
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
              "✅ *Mode Bot Diubah!*\n\n" + "Bot sekarang merespons di **GRUP DAN DM PRIBADI**.",
          },
          {quoted: m},
        );
      }

      if (subcommand === "info") {
        const currentMode = getBotMode();
        const modeText =
          currentMode === "group" ? "🔴 GRUP SAJA (DM diabaikan)" : "🟢 GRUP + DM PRIBADI";
        const description =
          currentMode === "group"
            ? "Bot hanya merespons di grup, chat pribadi akan diabaikan."
            : "Bot merespons di grup maupun chat pribadi.";

        return await sock.sendMessage(
          jid,
          {
            text:
              `╭━━━━ ⚙️ *BOT MODE* ━━━━╮\n` +
              `┃\n` +
              `┃ Mode Saat Ini: ${modeText}\n` +
              `┃\n` +
              `┃ ${description}\n` +
              `┃\n` +
              `┃ Ubah Mode:\n` +
              `┃ • \`!botmode group\` - Grup saja\n` +
              `┃ • \`!botmode all\` - Grup + DM\n` +
              `┃\n` +
              `╰━━━━━━━━━━━━━━━━━━━━━━╯`,
          },
          {quoted: m},
        );
      }

      // Jika subcommand tidak dikenal
      return await sock.sendMessage(
        jid,
        {
          text:
            `❓ *Subcommand tidak dikenal!*\n\n` +
            `Penggunaan:\n` +
            `┌─────────────────────────\n` +
            `│ \`!botmode all\` - Bot di grup + DM\n` +
            `│ \`!botmode group\` - Bot di grup saja\n` +
            `│ \`!botmode info\` - Lihat mode saat ini\n` +
            `└─────────────────────────`,
        },
        {quoted: m},
      );
    } catch (err) {
      console.error("Error pada command botmode:", err);
      return await sock.sendMessage(
        jid,
        {text: `❌ Terjadi kesalahan: ${err.message}`},
        {quoted: m},
      );
    }
  },
};
