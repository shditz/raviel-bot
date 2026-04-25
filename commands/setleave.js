const {isAdmin} = require("../utils/jid");

module.exports = {
  name: "setleave",
  description: "Mengatur pesan leave. Variabel: @user @group",
  async execute(sock, m, args, {jid, sender, isGroup, updateGroup}) {
    if (!isGroup) return await sock.sendMessage(jid, {text: "❌ Hanya untuk grup!"}, {quoted: m});
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender))
      return await sock.sendMessage(jid, {text: "❌ Hanya admin!"}, {quoted: m});
    const textMsg = args.join(" ");
    if (!textMsg)
      return await sock.sendMessage(
        jid,
        {text: "❌ Masukkan pesan!\nContoh: !setleave Bye @user"},
        {quoted: m},
      );
    updateGroup(jid, {leaveMessage: textMsg});
    await sock.sendMessage(jid, {text: "✅ Pesan leave berhasil diatur!"}, {quoted: m});
  },
};
