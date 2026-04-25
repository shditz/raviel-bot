const {isAdmin} = require("../utils/jid");

module.exports = {
  name: "setdesc",
  description: "Mengubah deskripsi informasi grup secara permanen.",
  async execute(sock, m, args, {jid, sender, isGroup, botId}) {
    if (!isGroup) return await sock.sendMessage(jid, {text: "❌ *AKSES DITOLAK*\n\nPerintah ini hanya dapat digunakan di dalam grup!"}, {quoted: m});
    
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender)) return await sock.sendMessage(jid, {text: "❌ *AKSES DIBATASI*\n\nMaaf, hanya Admin yang dapat mengubah deskripsi grup!"}, {quoted: m});
    if (!isAdmin(gm, botId)) return await sock.sendMessage(jid, {text: "❌ *GAGAL*\n\nBot harus menjadi Admin terlebih dahulu agar dapat memperbarui informasi grup!"}, {quoted: m});
      
    const desc = args.join(" ");
    if (!desc) return await sock.sendMessage(jid, {text: "❌ *MASUKKAN TEKS*\n\nSilakan tentukan teks deskripsi baru untuk grup ini.\n*Contoh:* !setdesc Peraturan grup baru..."}, {quoted: m});
    
    try {
      await sock.groupUpdateDescription(jid, desc);
      await sock.sendMessage(jid, {text: "✅ *BERHASIL*\n\nDeskripsi grup telah berhasil diperbarui sesuai permintaan Anda."}, {quoted: m});
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: `❌ *KESALAHAN SISTEM*\n\nGagal memperbarui deskripsi grup: ${err.message}`}, {quoted: m});
    }
  },
};
