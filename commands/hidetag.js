const {isAdmin} = require("../utils/jid");

module.exports = {
  name: "hidetag",
  description: "Menyebut seluruh member grup secara tersembunyi.",
  async execute(sock, m, args, {jid, sender, isGroup}) {
    if (!isGroup) return await sock.sendMessage(jid, {text: "❌ Hanya untuk grup!"}, {quoted: m});
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender))
      return await sock.sendMessage(jid, {text: "❌ Hanya admin!"}, {quoted: m});
    const msg = args.join(" ") || "Pemberitahuan!";
    const members = gm.participants.map((p) => p.id);
    await sock.sendMessage(jid, {text: msg, mentions: members});
  },
};
