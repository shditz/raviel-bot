const {isAdmin} = require("../utils/jid");

module.exports = {
  name: "antilink",
  description: "Menyalakan/mematikan proteksi anti-link grup.",
  async execute(sock, m, args, {jid, sender, isGroup, updateGroup, getGroup}) {
    if (!isGroup) return await sock.sendMessage(jid, {text: "❌ *AKSES DITOLAK*\n\nPerintah ini hanya dapat digunakan di dalam grup!"}, {quoted: m});
    
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender)) {
        return await sock.sendMessage(jid, {text: "❌ *AKSES DIBATASI*\n\nMaaf, hanya Admin yang dapat mengubah pengaturan Anti-Link!"}, {quoted: m});
    }

    const action = args[0]?.toLowerCase();
    if (action === "on") {
      updateGroup(jid, {antiLink: true});
      await sock.sendMessage(jid, {text: "✅ *BERHASIL*\n\nFitur *Anti-Link* telah diaktifkan. Anggota yang mengirim link grup lain akan dikeluarkan otomatis secara aman."}, {quoted: m});
    } else if (action === "off") {
      updateGroup(jid, {antiLink: false});
      await sock.sendMessage(jid, {text: "✅ *BERHASIL*\n\nFitur *Anti-Link* telah dimatikan. Anggota sekarang bebas mengirim link di grup ini."}, {quoted: m});
    } else {
      const g = getGroup(jid) || {};
      const status = g.antiLink ? "AKTIF (ON) 🟢" : "NONAKTIF (OFF) 🔴";
      await sock.sendMessage(
        jid,
        {text: `🛡️ *PENGATURAN ANTI-LINK*\n\nStatus Saat Ini: *${status}*\n\n💡 *Cara Penggunaan:*\n• ketik *!antilink on* untuk mengaktifkan.\n• ketik *!antilink off* untuk mematikan.`},
        {quoted: m},
      );
    }
  },
};
