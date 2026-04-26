module.exports = {
  name: "groupinfo",
  description: "Menampilkan statistik dan informasi detail mengenai grup ini.",
  async execute(sock, m, args, { jid }) {
    if (!jid.endsWith("@g.us")) {
      return await sock.sendMessage(jid, { text: "❌ *AKSES DITOLAK*\n\nPerintah ini hanya dapat digunakan di dalam grup!" }, { quoted: m });
    }

    try {
      const metadata = await sock.groupMetadata(jid);
      const participants = metadata.participants;
      const admins = participants.filter(p => p.admin).map(p => p.id);
      const owner = metadata.owner || admins[0];
      const creationDate = new Date(metadata.creation * 1000).toLocaleString("id-ID");

      const body = 
        `🏢 *GROUP INFO*\n` +
        `────────────────────\n` +
        `📛 *Nama Grup:* \n${metadata.subject}\n\n` +
        `👑 *Pemilik:* @${owner.split("@")[0]}\n` +
        `📅 *Dibuat:* ${creationDate}\n` +
        `👥 *Total Anggota:* ${participants.length}\n` +
        `👮 *Total Admin:* ${admins.length}\n` +
        `────────────────────\n` +
        `📝 *Deskripsi:* \n` +
        `${metadata.desc ? metadata.desc : "Tidak ada deskripsi."}`;

      await sock.sendMessage(jid, { 
        text: body,
        mentions: [owner]
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *GAGAL*\n\nMaaf, sistem gagal memuat informasi metadata grup saat ini." }, { quoted: m });
    }
  }
};
