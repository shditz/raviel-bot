module.exports = {
  name: "report",
  description: "Melaporkan bug atau masalah ke owner.",
  async execute(sock, m, args, { jid, sender, config, PREFIX }) {
    const reportText = args.join(" ");
    if (!reportText) return await sock.sendMessage(jid, { text: `❌ Masukkan laporan!\nContoh: *${PREFIX}report Fitur ping error tidak balas.*` }, { quoted: m });

    const ownerJid = config.ownerNumber + "@s.whatsapp.net";
    const reportMessage = `🚨 *LAPORAN BUG* 🚨\n\n👤 Dari: @${sender.split("@")[0]}\n📝 Pesan: ${reportText}`;

    try {
      await sock.sendMessage(ownerJid, { text: reportMessage, mentions: [sender] });
      await sock.sendMessage(jid, { text: "✅ Laporan berhasil dikirim ke Owner!" }, { quoted: m });
    } catch (err) {
      await sock.sendMessage(jid, { text: "❌ Gagal mengirim laporan ke Owner." }, { quoted: m });
    }
  }
};
