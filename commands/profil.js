module.exports = {
  name: "profil",
  aliases: ["profile", "me"],
  description: "Menampilkan kartu data diri dan statistik Anda di dalam database bot.",
  async execute(sock, m, args, { jid, sender, getUser }) {
    const u = getUser(sender);
    if (!u) return await sock.sendMessage(jid, { text: `❌ *DATA TIDAK DITEMUKAN*\n\nMaaf, informasi profil Anda tidak tersedia di database kami.` }, { quoted: m });
    
    await sock.sendMessage(jid, {
      text:
        `╭━━━━━━━━ 👤 *PROFIL USER* ━━━━━━━━╮\n` +
        `┃\n` +
        `┃ 📛 *Nama:* ${u.name}\n` +
        `┃ 🎂 *Umur:* ${u.age} Tahun\n` +
        `┃ 📅 *Join:* ${new Date(u.registeredAt).toLocaleDateString("id-ID")}\n` +
        `┃\n` +
        `┃ 🛡️ *STATISTIK KEAMANAN:*\n` +
        `┃ ⚠️ *Warn:* ${u.warn || 0} / 3\n` +
        `┃ 🛡️ *Status:* Terverifikasi\n` +
        `┃\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
    }, { quoted: m });
  }
};
