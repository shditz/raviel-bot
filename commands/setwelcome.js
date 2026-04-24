const { isAdmin } = require("../utils/jid");

module.exports = {
  name: "setwelcome",
  description: "Mengatur pesan welcome. Variabel: @user @group",
  async execute(sock, m, args, { jid, sender, isGroup, updateGroup }) {
    if (!isGroup) return await sock.sendMessage(jid, { text: "❌ Hanya untuk grup!" }, { quoted: m });
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender)) return await sock.sendMessage(jid, { text: "❌ Hanya admin!" }, { quoted: m });
    const textMsg = args.join(" ");
    if (!textMsg) return await sock.sendMessage(jid, { text: "❌ Masukkan pesan!\nContoh: !setwelcome Halo @user di @group" }, { quoted: m });
    updateGroup(jid, { welcomeMessage: textMsg });
    await sock.sendMessage(jid, { text: "✅ Pesan welcome berhasil diatur!" }, { quoted: m });
  }
};
