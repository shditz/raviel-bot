module.exports = {
  name: "report",
  description: "Melaporkan bug, kendala, atau saran pengembangan langsung kepada pemilik bot.",
  async execute(sock, m, args, { jid, sender, config, PREFIX }) {
    const reportText = args.join(" ");
    if (!reportText) return await sock.sendMessage(jid, { text: `❌ *MASUKKAN PESAN*\n\nSilakan tuliskan detail laporan Anda!\n*Contoh:* ${PREFIX}report Fitur stiker tidak merespons media video.` }, { quoted: m });

    const ownerJid = config.ownerNumber + "@s.whatsapp.net";
    const reportMessage = `🚨 *LAPORAN MASALAH SISTEM* 🚨\n\n👤 *Pelapor:* @${sender.split("@")[0]}\n📝 *Laporan:* \n${reportText}\n\n────────────────────\n_Harap segera ditindaklanjuti._`;

    try {
      await sock.sendMessage(ownerJid, { text: reportMessage, mentions: [sender] });
      await sock.sendMessage(jid, { text: "✅ *BERHASIL*\n\nLaporan Anda telah berhasil diteruskan ke pemilik bot. Terima kasih atas kontribusi Anda dalam menjaga stabilitas sistem!" }, { quoted: m });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *GAGAL*\n\nTerjadi kendala teknis saat mencoba mengirim laporan. Silakan hubungi owner secara manual jika mendesak." }, { quoted: m });
    }
  }
};
