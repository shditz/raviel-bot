module.exports = {
  name: "groupinfo",
  description: "Menampilkan informasi lengkap tentang grup ini.",
  async execute(sock, m, args, { jid }) {
    if (!jid.endsWith("@g.us")) {
      return await sock.sendMessage(jid, { text: "❌ Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: m });
    }

    try {
      const metadata = await sock.groupMetadata(jid);
      const participants = metadata.participants;
      const admins = participants.filter(p => p.admin).map(p => p.id);
      const owner = metadata.owner || admins[0];
      const creationDate = new Date(metadata.creation * 1000).toLocaleString("id-ID");

      const body = 
        `╭━━━━ 🏢 *Group Info* ━━━━╮\n` +
        `┃\n` +
        `┃ 📛 *Nama Grup*  : ${metadata.subject}\n` +
        `┃ 🆔 *ID Grup*    : ${metadata.id}\n` +
        `┃ 👑 *Pemilik*    : @${owner.split("@")[0]}\n` +
        `┃ 📅 *Dibuat*     : ${creationDate}\n` +
        `┃ 👥 *Anggota*    : ${participants.length} orang\n` +
        `┃ 👮 *Admin*      : ${admins.length} orang\n` +
        `┃ 📝 *Deskripsi*  : \n` +
        `${metadata.desc || "Tidak ada deskripsi."}\n` +
        `┃\n` +
        `╰━━━━━━━━━━━━━━━━━━━━╯`;

      await sock.sendMessage(jid, { 
        text: body,
        mentions: [owner]
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal mengambil informasi grup." }, { quoted: m });
    }
  }
};
