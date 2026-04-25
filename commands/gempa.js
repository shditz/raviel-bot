module.exports = {
  name: "gempa",
  description: "Menampilkan informasi detail mengenai gempa bumi terbaru di wilayah Indonesia.",
  async execute(sock, m, args, { jid }) {
    try {
      const res = await fetch("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json");
      const data = await res.json();
      const gempa = data.Infogempa.gempa;

      const body = 
        `🌋 *INFO GEMPA TERKINI*\n\n` +
        `📅 *Tanggal:* ${gempa.Tanggal}\n` +
        `⌚ *Waktu:* ${gempa.Jam}\n` +
        `📏 *Magnitudo:* ${gempa.Magnitude} SR\n` +
        `🌊 *Kedalaman:* ${gempa.Kedalaman}\n` +
        `────────────────────\n` +
        `🗺️ *Wilayah:* \n${gempa.Wilayah}\n\n` +
        `⚠️ *Potensi:* \n*${gempa.Potensi}*\n\n` +
        `📌 *Dirasakan:* \n${gempa.Dirasakan || "Tidak terdeteksi"}\n` +
        `────────────────────\n` +
        `_Sumber: Data Realtime BMKG_`;

      const imageUrl = `https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}`;

      await sock.sendMessage(jid, { 
        image: { url: imageUrl },
        caption: body 
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *KESALAHAN SISTEM*\n\nGagal mengambil data gempa bumi terbaru. Silakan coba kembali nanti." }, { quoted: m });
    }
  }
};
