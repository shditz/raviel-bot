const {isAdmin} = require("../utils/jid");

module.exports = {
  name: "promote",
  description: "Menaikkan jabatan member menjadi admin.",
  async execute(sock, m, args, {jid, sender, isGroup, botId}) {
    if (!isGroup) return await sock.sendMessage(jid, {text: "❌ Hanya untuk grup!"}, {quoted: m});
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender))
      return await sock.sendMessage(jid, {text: "❌ Hanya admin!"}, {quoted: m});
    if (!isAdmin(gm, botId))
      return await sock.sendMessage(jid, {text: "❌ Bot harus menjadi admin!"}, {quoted: m});
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length)
      return await sock.sendMessage(
        jid,
        {text: "❌ Tag member yang ingin dipromote!"},
        {quoted: m},
      );
    await sock.groupParticipantsUpdate(jid, mentioned, "promote");
    await sock.sendMessage(jid, {text: "✅ Berhasil mempromosikan member!"}, {quoted: m});
  },
};
