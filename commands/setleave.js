const {isAdmin} = require("../utils/jid");

module.exports = {
  name: "setleave",
  description: "Mengatur pesan perpisahan (Leave) otomatis untuk anggota yang keluar.",
  async execute(sock, m, args, {jid, sender, isGroup, updateGroup}) {
    if (!isGroup) return await sock.sendMessage(jid, {text: "❌ *AKSES DITOLAK*\n\nPerintah ini hanya dapat digunakan di dalam grup!"}, {quoted: m});
    
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender)) return await sock.sendMessage(jid, {text: "❌ *AKSES DIBATASI*\n\nMaaf, hanya Admin yang dapat mengubah konfigurasi pesan perpisahan!"}, {quoted: m});
    
    const textMsg = args.join(" ");
    if (!textMsg) {
        return await sock.sendMessage(jid, { 
            text: `❌ *MASUKKAN PESAN*\n\nSilakan tentukan pesan perpisahan yang Anda inginkan.\n\n💡 *Variabel Tersedia:*\n• *@user* : Sebut nama anggota\n• *@group* : Nama grup ini\n\n*Contoh:* \n!setleave Sampai jumpa lagi @user di luar @group! 👋` 
        }, { quoted: m });
    }

    updateGroup(jid, {leaveMessage: textMsg});
    await sock.sendMessage(jid, {text: "✅ *BERHASIL*\n\nPesan perpisahan grup telah berhasil diperbarui dan akan aktif saat ada anggota yang keluar."}, {quoted: m});
  },
};
