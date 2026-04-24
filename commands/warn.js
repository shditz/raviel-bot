const { isAdmin } = require("../utils/jid");

module.exports = {
  name: "warn",
  description: "Memberikan peringatan. 3x warn = kick.",
  async execute(sock, m, args, { jid, sender, isGroup, botId, addWarn, resetWarn }) {
    if (!isGroup) return await sock.sendMessage(jid, { text: "❌ Hanya grup!" }, { quoted: m });
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender)) return await sock.sendMessage(jid, { text: "❌ Hanya admin!" }, { quoted: m });
    if (!isAdmin(gm, botId)) return await sock.sendMessage(jid, { text: "❌ Bot harus admin!" }, { quoted: m });
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return await sock.sendMessage(jid, { text: "❌ Tag member yang ingin di-warn!" }, { quoted: m });
    const target = mentioned[0];
    const warnCount = addWarn(target);
    if (warnCount >= 3) {
      await sock.sendMessage(jid, { text: `⚠️ @${target.split("@")[0]} mencapai 3/3 warn. Dikeluarkan!`, mentions: [target] });
      await sock.groupParticipantsUpdate(jid, [target], "remove");
      resetWarn(target);
    } else {
      await sock.sendMessage(jid, { text: `⚠️ Peringatan ${warnCount}/3 untuk @${target.split("@")[0]}`, mentions: [target] }, { quoted: m });
    }
  }
};
