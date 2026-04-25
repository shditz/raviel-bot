const {isAdmin} = require("../utils/jid");

module.exports = {
  name: "demote",
  description: "Menurunkan jabatan admin menjadi member.",
  async execute(sock, m, args, {jid, sender, isGroup, botId}) {
    if (!isGroup) return await sock.sendMessage(jid, {text: "❌ Hanya untuk grup!"}, {quoted: m});
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender))
      return await sock.sendMessage(jid, {text: "❌ Hanya admin!"}, {quoted: m});
    if (!isAdmin(gm, botId))
      return await sock.sendMessage(jid, {text: "❌ Bot harus menjadi admin!"}, {quoted: m});
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length)
      return await sock.sendMessage(jid, {text: "❌ Tag admin yang ingin didemote!"}, {quoted: m});
    await sock.groupParticipantsUpdate(jid, mentioned, "demote");
    await sock.sendMessage(jid, {text: "✅ Berhasil menurunkan jabatan admin!"}, {quoted: m});
  },
};
