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
  description: "Mengatur izin penggunaan bot hanya untuk grup-grup tertentu yang disetujui oleh Owner.",
  aliases: ["wl"],
  async execute(sock, m, args, {jid, sender, isGroup, botId}) {
    if (sender !== `${config.ownerNumber}@s.whatsapp.net`) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *AKSES DITOLAK*\n\nPerintah ini bersifat rahasia dan hanya dapat diakses oleh Pemilik Bot (Owner)!"},
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
              "✅ *WHITELIST DIAKTIFKAN*\n\n" +
              "Sistem keamanan sekarang aktif. Bot hanya akan merespons pada grup yang telah terdaftar dalam daftar putih.\n\n" +
              "💡 _Gunakan `!whitelist add` untuk mendaftarkan grup._",
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
              "✅ *WHITELIST DINONAKTIFKAN*\n\n" + 
              "Sistem keamanan telah dimatikan. Bot sekarang akan merespons di semua grup tanpa terkecuali.",
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
                "❌ *KHUSUS GRUP*\n\n" +
                "Silakan jalankan perintah ini di dalam grup yang ingin Anda daftarkan!\n\n" +
                "*Format:* `!whitelist add`",
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
              `✅ *GRUP BERHASIL DIDAFTARKAN*\n\n` +
              `🏢 *Nama Grup:* ${groupName}\n` +
              `🆔 *Grup ID:* ${targetGroup}\n\n` +
              `📊 *Total Terdaftar:* ${whitelistData.groups.length} Grup\n` +
              `🛡️ *Status:* ${whitelistData.enabled ? "🟢 Aktif" : "🔴 Nonaktif"}`,
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
                "❌ *KHUSUS GRUP*\n\n" +
                "Silakan jalankan perintah ini di dalam grup yang ingin Anda hapus aksesnya!\n\n" +
                "*Format:* `!whitelist remove`",
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
              `✅ *GRUP BERHASIL DIHAPUS*\n\n` +
              `🏢 *Nama Grup:* ${groupName}\n` +
              `🆔 *Grup ID:* ${targetGroup}\n\n` +
              `📊 *Total Terdaftar:* ${whitelistData.groups.length} Grup\n` +
              `🛡️ *Status:* ${whitelistData.enabled ? "🟢 Aktif" : "🔴 Nonaktif"}`,
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
              `📋 *DAFTAR WHITELIST*\n` +
              `────────────────────\n` +
              `🛡️ *Status:* ${statusText}\n` +
              `────────────────────\n` +
              `❌ Belum ada grup terdaftar.\n\n` +
              `💡 _Gunakan !whitelist add di grup untuk mendaftarkan akses._`,
            },
            {quoted: m},
          );
        }

        let listText =
          `📋 *DAFTAR WHITELIST*\n` +
          `────────────────────\n` +
          `🛡️ *Status:* ${statusText}\n` +
          `📊 *Total:* ${whitelistData.groups.length} Grup\n` +
          `────────────────────\n`;

        for (let i = 0; i < whitelistData.groups.length; i++) {
          try {
            const groupId = whitelistData.groups[i];
            const metadata = await sock.groupMetadata(groupId);
            listText += `🔹 *${metadata.subject}*\n`;
            listText += `   ID: ${groupId}\n`;
          } catch (err) {
            listText += `🔸 *(Grup Tidak Ditemukan)*\n`;
          }
        }
        
        listText += `────────────────────`;

        return await sock.sendMessage(jid, {text: listText}, {quoted: m});
      }

      return await sock.sendMessage(
        jid,
        {
          text:
            `❓ *SUB-COMMAND TIDAK VALID*\n\n` +
            `Gunakan salah satu opsi berikut:\n` +
            `────────────────────\n` +
            `• \`!whitelist enable\`\n` +
            `• \`!whitelist disable\`\n` +
            `• \`!whitelist add\`\n` +
            `• \`!whitelist remove\`\n` +
            `• \`!whitelist list\``,
        },
        {quoted: m},
      );
    } catch (err) {
      console.error("Error pada command whitelist:", err);
      return await sock.sendMessage(
        jid,
        {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat memproses perintah whitelist. Silakan coba kembali nanti."},
        {quoted: m},
      );
    }
  },
};
