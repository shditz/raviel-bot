const {isAdmin} = require("../utils/jid");

module.exports = {
  name: "warn",
  description: "Memberikan peringatan kepada anggota. Akumulasi 3 peringatan akan berujung pengeluaran (kick).",
  async execute(sock, m, args, {jid, sender, isGroup, botId, addWarn, resetWarn}) {
    if (!isGroup) return await sock.sendMessage(jid, {text: "❌ *AKSES DITOLAK*\n\nPerintah ini hanya dapat digunakan di dalam grup!"}, {quoted: m});
    
    const gm = await sock.groupMetadata(jid);
    if (!isAdmin(gm, sender)) return await sock.sendMessage(jid, {text: "❌ *AKSES DIBATASI*\n\nMaaf, hanya Admin yang dapat memberikan peringatan kepada anggota!"}, {quoted: m});
    if (!isAdmin(gm, botId)) return await sock.sendMessage(jid, {text: "❌ *GAGAL*\n\nBot harus menjadi Admin agar dapat memproses sanksi pengeluaran secara otomatis!"}, {quoted: m});
    
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return await sock.sendMessage(jid, {text: "❌ *PILIH ANGGOTA*\n\nSilakan tag anggota yang ingin Anda berikan peringatan!"}, {quoted: m});
    
    const target = mentioned[0];
    const warnCount = addWarn(target);
    
    if (warnCount >= 3) {
      await sock.sendMessage(jid, {
        text: `⚠️ *SANKSI PENGELUARAN*\n\nAnggota @${target.split("@")[0]} telah mencapai batas maksimal peringatan (3/3). Dengan ini sistem mengeluarkan anggota tersebut secara otomatis.`,
        mentions: [target],
      });
      await sock.groupParticipantsUpdate(jid, [target], "remove");
      resetWarn(target);
    } else {
      await sock.sendMessage(
        jid,
        {
          text: `⚠️ *PERINGATAN PELANGGARAN*\n\nAnggota @${target.split("@")[0]} telah diberikan peringatan.\nAkumulasi Saat Ini: *${warnCount}/3*\n\n_Harap mematuhi peraturan grup agar tidak mencapai batas maksimal (3/3)._`, 
          mentions: [target]
        },
        {quoted: m},
      );
    }
  },
};
