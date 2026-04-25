const {isAdmin} = require("../utils/jid");

module.exports = {
  name: "linkgroup",
  description: "Mengambil link undangan grup.",
  async execute(sock, m, args, {jid, isGroup, botId}) {
    if (!isGroup) return await sock.sendMessage(jid, {text: "❌ Hanya untuk grup!"}, {quoted: m});
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, botId))
      return await sock.sendMessage(jid, {text: "❌ Bot harus admin!"}, {quoted: m});
    const code = await sock.groupInviteCode(jid);
    await sock.sendMessage(
      jid,
      {text: `🔗 *Link ${gm.subject}*\n\nhttps://chat.whatsapp.com/${code}`},
      {quoted: m},
    );
  },
};
