const { isAdmin } = require("../utils/jid");

module.exports = {
  name: "antilink",
  description: "Menyalakan/mematikan anti-link. Gunakan: !antilink on/off",
  async execute(sock, m, args, { jid, sender, isGroup, updateGroup, getGroup }) {
    if (!isGroup) return await sock.sendMessage(jid, { text: "❌ Hanya untuk grup!" }, { quoted: m });
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender)) return await sock.sendMessage(jid, { text: "❌ Hanya admin!" }, { quoted: m });
    const action = args[0]?.toLowerCase();
    if (action === "on") {
      updateGroup(jid, { antiLink: true });
      await sock.sendMessage(jid, { text: "✅ Anti-link diaktifkan!" }, { quoted: m });
    } else if (action === "off") {
      updateGroup(jid, { antiLink: false });
      await sock.sendMessage(jid, { text: "✅ Anti-link dimatikan!" }, { quoted: m });
    } else {
      const g = getGroup(jid) || {};
      await sock.sendMessage(jid, { text: `⚠️ Gunakan !antilink on/off\nStatus: ${g.antiLink ? "ON" : "OFF"}` }, { quoted: m });
    }
  }
};
