const config = require("../config");
const {
  isWhitelistEnabled,
  enableWhitelist,
  disableWhitelist,
  addToWhitelist,
  removeFromWhitelist,
  getWhitelistGroups,
} = require("../database/db");

module.exports = {
  name: "whitelist",
  description: "Mengatur grup mana saja yang boleh menggunakan bot (hanya owner).",
  aliases: ["wl"],
  async execute(sock, m, args, {jid, sender, isGroup, botId}) {
    // Cek apakah pengguna adalah owner
    if (sender !== `${config.ownerNumber}@s.whatsapp.net`) {
      return await sock.sendMessage(
        jid,
        {text: "❌ Hanya owner yang bisa menggunakan command ini!"},
        {quoted: m},
      );
    }

    const subcommand = (args[0] || "list").toLowerCase();

    try {
      if (subcommand === "enable") {
        enableWhitelist();
        return await sock.sendMessage(
          jid,
          {
            text:
              "✅ *Whitelist diaktifkan!*\n\n" +
              "Bot sekarang hanya akan merespons di grup yang telah di-whitelist.\n\n" +
              "_Gunakan `!whitelist add` untuk menambahkan grup._",
          },
          {quoted: m},
        );
      }

      if (subcommand === "disable") {
        disableWhitelist();
        return await sock.sendMessage(
          jid,
          {
            text:
              "✅ *Whitelist dinonaktifkan!*\n\n" + "Bot sekarang akan merespons di semua grup.",
          },
          {quoted: m},
        );
      }

      if (subcommand === "add") {
        if (!isGroup) {
          return await sock.sendMessage(
            jid,
            {
              text:
                "❌ *Gunakan command ini di grup!*\n\n" +
                "Atau kirim grup ID-nya.\n\n" +
                "Format: `!whitelist add <grup_id>`",
            },
            {quoted: m},
          );
        }

        const targetGroup = jid;
        const whitelistData = addToWhitelist(targetGroup);

        const metadata = await sock.groupMetadata(targetGroup);
        const groupName = metadata.subject;

        return await sock.sendMessage(
          jid,
          {
            text:
              `✅ *Grup berhasil ditambahkan ke whitelist!*\n\n` +
              `📍 Nama Grup: *${groupName}*\n` +
              `🔗 Grup ID: *${targetGroup}*\n\n` +
              `📊 Total grup whitelisted: *${whitelistData.groups.length}*\n` +
              `Status: ${whitelistData.enabled ? "🟢 Aktif" : "🔴 Nonaktif"}`,
          },
          {quoted: m},
        );
      }

      if (subcommand === "remove") {
        if (!isGroup) {
          return await sock.sendMessage(
            jid,
            {
              text:
                "❌ *Gunakan command ini di grup!*\n\n" +
                "Atau kirim grup ID-nya.\n\n" +
                "Format: `!whitelist remove <grup_id>`",
            },
            {quoted: m},
          );
        }

        const targetGroup = jid;
        const whitelistData = removeFromWhitelist(targetGroup);

        const metadata = await sock.groupMetadata(targetGroup);
        const groupName = metadata.subject;

        return await sock.sendMessage(
          jid,
          {
            text:
              `✅ *Grup berhasil dihapus dari whitelist!*\n\n` +
              `📍 Nama Grup: *${groupName}*\n` +
              `🔗 Grup ID: *${targetGroup}*\n\n` +
              `📊 Total grup whitelisted: *${whitelistData.groups.length}*\n` +
              `Status: ${whitelistData.enabled ? "🟢 Aktif" : "🔴 Nonaktif"}`,
          },
          {quoted: m},
        );
      }

      if (subcommand === "list") {
        const whitelistData = getWhitelistGroups();
        const statusText = whitelistData.enabled ? "🟢 AKTIF" : "🔴 NONAKTIF";

        if (!whitelistData.groups || whitelistData.groups.length === 0) {
          return await sock.sendMessage(
            jid,
            {
              text:
                `╭━━━ 📋 *DAFTAR WHITELIST* ━━━╮\n` +
                `┃\n` +
                `┃ Status: ${statusText}\n` +
                `┃\n` +
                `┃ ❌ Belum ada grup yang di-whitelist.\n` +
                `┃\n` +
                `┃ Gunakan \`!whitelist add\` di grup\n` +
                `┃ yang ingin ditambahkan.\n` +
                `┃\n` +
                `╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
            },
            {quoted: m},
          );
        }

        let listText =
          `╭━━━ 📋 *DAFTAR WHITELIST* ━━━╮\n` +
          `┃\n` +
          `┃ Status: ${statusText}\n` +
          `┃ Total: *${whitelistData.groups.length}* grup\n` +
          `┃\n`;

        for (let i = 0; i < whitelistData.groups.length; i++) {
          try {
            const groupId = whitelistData.groups[i];
            const metadata = await sock.groupMetadata(groupId);
            listText += `┃ ${i + 1}. *${metadata.subject}*\n`;
            listText += `┃    ID: ${groupId}\n`;
          } catch (err) {
            listText += `┃ ${i + 1}. *(Grup tidak ditemukan)*\n`;
          }
        }

        listText += `┃\n` + `╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        return await sock.sendMessage(jid, {text: listText}, {quoted: m});
      }

      // Jika subcommand tidak dikenal
      return await sock.sendMessage(
        jid,
        {
          text:
            `❓ *Subcommand tidak dikenal!*\n\n` +
            `Penggunaan:\n` +
            `┌─────────────────────────\n` +
            `│ \`!whitelist enable\` - Aktifkan whitelist\n` +
            `│ \`!whitelist disable\` - Nonaktifkan whitelist\n` +
            `│ \`!whitelist add\` - Tambah grup saat ini\n` +
            `│ \`!whitelist remove\` - Hapus grup saat ini\n` +
            `│ \`!whitelist list\` - Lihat daftar grup\n` +
            `└─────────────────────────`,
        },
        {quoted: m},
      );
    } catch (err) {
      console.error("Error pada command whitelist:", err);
      return await sock.sendMessage(
        jid,
        {text: `❌ Terjadi kesalahan: ${err.message}`},
        {quoted: m},
      );
    }
  },
};
