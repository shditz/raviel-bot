module.exports = {
  name: "tagall",
  description: "Menyebut (mention) seluruh anggota grup secara cepat.",
  async execute(sock, m, args, { jid }) {
    if (!jid.endsWith("@g.us")) {
      return await sock.sendMessage(jid, { text: "❌ *AKSES DITOLAK*\n\nPerintah ini hanya dapat digunakan di dalam grup!" }, { quoted: m });
    }

    try {
      const metadata = await sock.groupMetadata(jid);
      const participants = metadata.participants;
      const message = args.join(" ") || "Perhatian untuk semuanya!";
      
      let tagText = `📢 *PENGUMUMAN GRUP*\n\n`;
      tagText += `📝 *Pesan:* _${message}_\n`;
      tagText += `👥 *Total:* ${participants.length} Anggota\n`;
      tagText += `────────────────────\n\n`;
      
      const mentions = [];
      for (let mem of participants) {
        tagText += `◦ @${mem.id.split("@")[0]}\n`;
        mentions.push(mem.id);
      }

      tagText += `\n────────────────────\n`;
      tagText += `_Harap baca pesan di atas dengan teliti._`;

      await sock.sendMessage(jid, { 
        text: tagText,
        mentions: mentions
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *GAGAL*\n\nTerjadi kesalahan sistem saat mencoba melakukan Tag All." }, { quoted: m });
    }
  }
};
