const {isAdmin} = require("../utils/jid");

module.exports = {
  name: "kick",
  description: "Mengeluarkan anggota dari grup secara paksa.",
  async execute(sock, m, args, {jid, sender, isGroup, botId}) {
    if (!isGroup) return await sock.sendMessage(jid, {text: "❌ *AKSES DITOLAK*\n\nPerintah ini hanya dapat digunakan di dalam grup!"}, {quoted: m});
    
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender)) return await sock.sendMessage(jid, {text: "❌ *AKSES DIBATASI*\n\nMaaf, hanya Admin yang dapat menggunakan perintah ini!"}, {quoted: m});
    if (!isAdmin(gm, botId)) return await sock.sendMessage(jid, {text: "❌ *GAGAL*\n\nBot harus menjadi Admin terlebih dahulu agar dapat memproses perintah ini!"}, {quoted: m});
    
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return await sock.sendMessage(jid, {text: "❌ *PILIH ANGGOTA*\n\nSilakan tag anggota yang ingin Anda keluarkan dari grup!"}, {quoted: m});
    
    try {
        await sock.groupParticipantsUpdate(jid, mentioned, "remove");
        await sock.sendMessage(jid, {text: `✅ *BERHASIL*\n\nAnggota yang dipilih telah berhasil dikeluarkan dari grup.`}, {quoted: m});
    } catch (err) {
        await sock.sendMessage(jid, {text: `❌ *GAGAL*\n\nTerjadi kesalahan saat mencoba mengeluarkan anggota: ${err.message}`}, {quoted: m});
    }
  },
};
