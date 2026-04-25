const config = require("../config");
const { updateSettings, banUser, unbanUser, setBlacklist } = require("../database/db");
const { normalizeJid } = require("../utils/jid");

module.exports = {
  name: "owner_actions",
  aliases: ["restart", "shutdown", "setprefix", "maintenance", "ban", "unban", "blacklist"],
  description: "Fitur kontrol tingkat tinggi khusus untuk pemilik bot (Owner).",
  async execute(sock, m, args, { jid, sender, isOwner, PREFIX, cmd }) {
    if (!isOwner) return await sock.sendMessage(jid, { text: "❌ *AKSES DITOLAK*\n\nPerintah ini bersifat rahasia dan hanya dapat diakses oleh Pemilik Bot!" }, { quoted: m });

    if (cmd === "restart") {
      updateSettings({ restarted: true, restartJid: jid });
      await sock.sendMessage(jid, { text: "🔄 *MENGULANG SISTEM...*\n\nBot sedang melakukan pemuatan ulang (restart). Mohon tunggu beberapa detik hingga bot kembali aktif." }, { quoted: m });
      setTimeout(() => process.exit(0), 1000);
    }

    if (cmd === "shutdown") {
      await sock.sendMessage(jid, { text: "⏹️ *MEMATIKAN SISTEM...*\n\nProses penghentian bot sedang dijalankan secara paksa." }, { quoted: m });
      setTimeout(async () => {
        try {
          await sock.sendMessage(jid, { text: "✅ *OFFLINE*\n\nSistem bot telah dimatikan sepenuhnya." });
        } catch {}
        process.exit(1);
      }, 1000);
    }

    if (cmd === "setprefix") {
      const newPrefix = args[0];
      if (!newPrefix) return await sock.sendMessage(jid, { text: "⚠️ *MASUKKAN PREFIX*\n\nSilakan tentukan simbol prefix baru!\n*Contoh:* !setprefix #" }, { quoted: m });
      updateSettings({ prefix: newPrefix });
      await sock.sendMessage(jid, { text: `✅ *PREFIX DIPERBARUI*\n\nSimbol prefix berhasil diubah menjadi: *${newPrefix}*` }, { quoted: m });
    }

    if (cmd === "maintenance") {
      const status = args[0]?.toLowerCase();
      if (status === "on") {
        updateSettings({ maintenance: true });
        await sock.sendMessage(jid, { text: "🛠️ *MAINTENANCE AKTIF*\n\nMode perbaikan telah diaktifkan. Pengguna biasa tidak dapat mengakses bot untuk sementara waktu." }, { quoted: m });
      } else if (status === "off") {
        updateSettings({ maintenance: false });
        await sock.sendMessage(jid, { text: "✅ *MAINTENANCE SELESAI*\n\nMode perbaikan telah dimatikan. Bot kembali dapat digunakan oleh semua pengguna." }, { quoted: m });
      } else {
        await sock.sendMessage(jid, { text: "❌ *PILIH STATUS*\n\nGunakan format: *!maintenance on/off*" }, { quoted: m });
      }
    }

    if (cmd === "ban" || cmd === "blacklist") {
      let target;
      if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (m.message.extendedTextMessage?.contextInfo?.quotedMessage) {
        target = m.message.extendedTextMessage.contextInfo.participant;
      } else if (args[0]) {
        target = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      }

      if (!target) return await sock.sendMessage(jid, { text: "⚠️ *PILIH TARGET*\n\nSilakan tag, reply, atau masukkan nomor pengguna yang ingin diberikan sanksi!" }, { quoted: m });

      if (cmd === "ban") {
        banUser(target);
        await sock.sendMessage(jid, { text: `🔨 *PENGGUNA DIBANNED*\n\nBerhasil memblokir akses bot untuk user: @${target.split("@")[0]}`, mentions: [target] }, { quoted: m });
      } else {
        setBlacklist(target, true);
        await sock.sendMessage(jid, { text: `🚫 *DAFTAR HITAM*\n\nBerhasil memasukkan user @${target.split("@")[0]} ke dalam daftar hitam sistem.`, mentions: [target] }, { quoted: m });
      }
    }

    if (cmd === "unban") {
      let target;
      if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (m.message.extendedTextMessage?.contextInfo?.quotedMessage) {
        target = m.message.extendedTextMessage.contextInfo.participant;
      } else if (args[0]) {
        target = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      }

      if (!target) return await sock.sendMessage(jid, { text: "⚠️ *PILIH TARGET*\n\nSilakan tag, reply, atau masukkan nomor pengguna yang ingin dipulihkan aksesnya!" }, { quoted: m });

      unbanUser(target);
      setBlacklist(target, false);
      await sock.sendMessage(jid, { text: `✅ *AKSES DIPULIHKAN*\n\nSanksi telah dicabut. User @${target.split("@")[0]} kini dapat menggunakan bot kembali.`, mentions: [target] }, { quoted: m });
    }
  },
};
