const { isAdmin } = require("../utils/jid");

module.exports = {
  name: "group",
  description: "Membuka/Menutup grup. Gunakan: !group open/close",
  async execute(sock, m, args, { jid, sender, isGroup, botId }) {
    if (!isGroup) return await sock.sendMessage(jid, { text: "❌ Hanya grup!" }, { quoted: m });
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender)) return await sock.sendMessage(jid, { text: "❌ Hanya admin!" }, { quoted: m });
    if (!isAdmin(gm, botId)) return await sock.sendMessage(jid, { text: "❌ Bot harus admin!" }, { quoted: m });
    const action = args[0]?.toLowerCase();
    if (action === "close") {
      await sock.groupSettingUpdate(jid, "announcement");
      await sock.sendMessage(jid, { text: "✅ Grup ditutup! Hanya admin yang bisa mengirim pesan." }, { quoted: m });
    } else if (action === "open") {
      await sock.groupSettingUpdate(jid, "not_announcement");
      await sock.sendMessage(jid, { text: "✅ Grup dibuka! Semua member bisa mengirim pesan." }, { quoted: m });
    } else {
      await sock.sendMessage(jid, { text: "⚠️ Gunakan !group open/close" }, { quoted: m });
    }
  }
};
