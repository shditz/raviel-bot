const {isAdmin} = require("../utils/jid");

module.exports = {
  name: "linkgroup",
  aliases: ["linkgc"],
  description: "Mendapatkan tautan undangan resmi untuk bergabung ke grup ini.",
  async execute(sock, m, args, {jid, isGroup, botId}) {
    if (!isGroup) return await sock.sendMessage(jid, {text: "❌ *AKSES DITOLAK*\n\nPerintah ini hanya dapat digunakan di dalam grup!"}, {quoted: m});
    
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, botId)) return await sock.sendMessage(jid, {text: "❌ *GAGAL*\n\nBot harus menjadi Admin terlebih dahulu agar dapat mengambil tautan grup!"}, {quoted: m});
    
    try {
        const code = await sock.groupInviteCode(jid);
        await sock.sendMessage(
          jid,
          {
            text: `🔗 *TAUTAN UNDANGAN GRUP*\n\n` +
                  `📌 *Grup:* ${gm.subject}\n` +
                  `🌐 *Link:* https://chat.whatsapp.com/${code}\n\n` +
                  `_Gunakan tautan ini dengan bijak untuk mengundang teman Anda._`
          },
          {quoted: m},
        );
    } catch (err) {
        console.error(err);
        await sock.sendMessage(jid, {text: "❌ *KESALAHAN SISTEM*\n\nGagal mengambil tautan undangan grup saat ini."}, {quoted: m});
    }
  },
};
