const {isAdmin} = require("../utils/jid");

module.exports = {
  name: "demote",
  description: "Menurunkan jabatan Admin menjadi anggota biasa.",
  async execute(sock, m, args, {jid, sender, isGroup, botId}) {
    if (!isGroup) return await sock.sendMessage(jid, {text: "❌ *AKSES DITOLAK*\n\nPerintah ini hanya dapat digunakan di dalam grup!"}, {quoted: m});
    
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender)) return await sock.sendMessage(jid, {text: "❌ *AKSES DIBATASI*\n\nMaaf, hanya Admin yang dapat menggunakan perintah ini!"}, {quoted: m});
    if (!isAdmin(gm, botId)) return await sock.sendMessage(jid, {text: "❌ *GAGAL*\n\nBot harus menjadi Admin terlebih dahulu agar dapat memproses perintah ini!"}, {quoted: m});
    
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return await sock.sendMessage(jid, {text: "❌ *PILIH ADMIN*\n\nSilakan tag Admin yang ingin Anda turunkan jabatannya!"}, {quoted: m});
    
    try {
        await sock.groupParticipantsUpdate(jid, mentioned, "demote");
        await sock.sendMessage(jid, {text: `✅ *BERHASIL*\n\nJabatan Admin telah berhasil diturunkan menjadi *Anggota Biasa*.`}, {quoted: m});
    } catch (err) {
        await sock.sendMessage(jid, {text: `❌ *GAGAL*\n\nTerjadi kesalahan saat mencoba menurunkan jabatan anggota: ${err.message}`}, {quoted: m});
    }
  },
};
