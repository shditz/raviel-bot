module.exports = {
  name: "tagall",
  description: "Menyebut semua anggota grup.",
  async execute(sock, m, args, { jid }) {
    if (!jid.endsWith("@g.us")) {
      return await sock.sendMessage(jid, { text: "❌ Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: m });
    }

    try {
      const metadata = await sock.groupMetadata(jid);
      const participants = metadata.participants;
      const message = args.join(" ") || "📢 Pengumuman untuk semua!";
      
      let tagText = `📣 *TAG ALL*\n\n💬 Pesan: *${message}*\n\n`;
      const mentions = [];

      for (let mem of participants) {
        tagText += ` @${mem.id.split("@")[0]}`;
        mentions.push(mem.id);
      }

      await sock.sendMessage(jid, { 
        text: tagText,
        mentions: mentions
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal melakukan tag all." }, { quoted: m });
    }
  }
};
