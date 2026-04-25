const { isAdmin } = require("../utils/jid");

module.exports = {
  name: "setwelcome",
  description: "Mengatur pesan sambutan (Welcome) otomatis untuk anggota baru.",
  async execute(sock, m, args, { jid, sender, isGroup, updateGroup }) {
    if (!isGroup) return await sock.sendMessage(jid, { text: "❌ *AKSES DITOLAK*\n\nPerintah ini hanya dapat digunakan di dalam grup!" }, { quoted: m });
    
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender)) return await sock.sendMessage(jid, { text: "❌ *AKSES DIBATASI*\n\nMaaf, hanya Admin yang dapat mengubah konfigurasi pesan sambutan!" }, { quoted: m });
    
    const textMsg = args.join(" ");
    if (!textMsg) {
        return await sock.sendMessage(jid, { 
            text: `❌ *MASUKKAN PESAN*\n\nSilakan tentukan pesan sambutan yang Anda inginkan.\n\n💡 *Variabel Tersedia:*\n• *@user* : Sebut nama anggota\n• *@group* : Nama grup ini\n\n*Contoh:* \n!setwelcome Selamat datang @user di grup @group! 🎉` 
        }, { quoted: m });
    }

    updateGroup(jid, { welcomeMessage: textMsg });
    await sock.sendMessage(jid, { text: "✅ *BERHASIL*\n\nPesan sambutan grup telah berhasil diperbarui dan akan aktif saat ada anggota baru bergabung." }, { quoted: m });
  }
};
