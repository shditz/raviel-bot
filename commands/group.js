const {isAdmin} = require("../utils/jid");

module.exports = {
  name: "group",
  description: "Mengatur izin pengiriman pesan di dalam grup (Buka/Tutup).",
  async execute(sock, m, args, {jid, sender, isGroup, botId}) {
    if (!isGroup) return await sock.sendMessage(jid, {text: "❌ *AKSES DITOLAK*\n\nPerintah ini hanya dapat digunakan di dalam grup!"}, {quoted: m});
    
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender)) return await sock.sendMessage(jid, {text: "❌ *AKSES DIBATASI*\n\nMaaf, hanya Admin yang dapat mengubah pengaturan grup!"}, {quoted: m});
    if (!isAdmin(gm, botId)) return await sock.sendMessage(jid, {text: "❌ *GAGAL*\n\nBot harus menjadi Admin terlebih dahulu agar dapat mengontrol pengaturan grup!"}, {quoted: m});
    
    const action = args[0]?.toLowerCase();
    if (action === "close") {
      await sock.groupSettingUpdate(jid, "announcement");
      await sock.sendMessage(
        jid,
        {text: "🔒 *GRUP DITUTUP*\n\nBerhasil mengubah pengaturan grup. Sekarang hanya *Admin* yang dapat mengirim pesan di grup ini."},
        {quoted: m},
      );
    } else if (action === "open") {
      await sock.groupSettingUpdate(jid, "not_announcement");
      await sock.sendMessage(
        jid,
        {text: "🔓 *GRUP DIBUKA*\n\nBerhasil mengubah pengaturan grup. Sekarang *Semua Anggota* dapat mengirim pesan kembali."},
        {quoted: m},
      );
    } else {
      await sock.sendMessage(jid, {text: "❌ *PILIH AKSI*\n\nSilakan tentukan aksi yang diinginkan!\n*Contoh:* !group open / !group close"}, {quoted: m});
    }
  },
};
