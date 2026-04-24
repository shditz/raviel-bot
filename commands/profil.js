module.exports = {
  name: "profil",
  aliases: ["profile", "me"],
  description: "Menampilkan kartu data diri kamu.",
  async execute(sock, m, args, { jid, sender, getUser }) {
    const u = getUser(sender);
    if (!u) return await sock.sendMessage(jid, { text: `❌ Data tidak ditemukan.` }, { quoted: m });
    
    await sock.sendMessage(jid, {
      text:
        `╭━━━━ 👤 *Profil* ━━━━╮\n` +
        `┃\n` +
        `┃ 📛 Nama : *${u.name}*\n` +
        `┃ 🎂 Umur : *${u.age} tahun*\n` +
        `┃ ⚠️ Warn : *${u.warn || 0} / 3*\n` +
        `┃ 📅 Sejak: *${new Date(u.registeredAt).toLocaleDateString("id-ID")}*\n` +
        `┃\n` +
        `╰━━━━━━━━━━━━━━━━━━━╯`,
    }, { quoted: m });
  }
};
