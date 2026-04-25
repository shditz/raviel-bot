const {isAdmin} = require("../utils/jid");

module.exports = {
  name: "hidetag",
  description: "Menyebut seluruh anggota grup secara tersembunyi (tanpa daftar nama).",
  async execute(sock, m, args, {jid, sender, isGroup}) {
    if (!isGroup) return await sock.sendMessage(jid, {text: "❌ *AKSES DITOLAK*\n\nPerintah ini hanya dapat digunakan di dalam grup!"}, {quoted: m});
    
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender)) {
        return await sock.sendMessage(jid, {text: "❌ *AKSES DIBATASI*\n\nMaaf, hanya Admin yang dapat menggunakan perintah Hidetag!"}, {quoted: m});
    }

    const msg = args.join(" ") || "Pemberitahuan untuk seluruh anggota grup!";
    const members = gm.participants.map((p) => p.id);
    
    await sock.sendMessage(jid, {
        text: `📢 *INFO GRUP*\n\n${msg}`, 
        mentions: members
    });
  },
};
