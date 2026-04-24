module.exports = {
  name: "gempa",
  description: "Menampilkan informasi gempa bumi terkini dari BMKG.",
  async execute(sock, m, args, { jid }) {
    try {
      const res = await fetch("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json");
      const data = await res.json();
      const gempa = data.Infogempa.gempa;

      const body = 
        `🌋 *INFO GEMPA TERKINI (BMKG)*\n\n` +
        `📅 *Tanggal:* ${gempa.Tanggal}\n` +
        `⌚ *Waktu:* ${gempa.Jam}\n` +
        `📍 *Koordinat:* ${gempa.Coordinates}\n` +
        `📏 *Magnitudo:* ${gempa.Magnitude}\n` +
        `🌊 *Kedalaman:* ${gempa.Kedalaman}\n` +
        `🗺️ *Wilayah:* ${gempa.Wilayah}\n` +
        `⚠️ *Potensi:* ${gempa.Potensi}\n` +
        `📌 *Dirasakan:* ${gempa.Dirasakan || "Tidak ada data"}\n\n`;

      const imageUrl = `https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}`;

      await sock.sendMessage(jid, { 
        image: { url: imageUrl },
        caption: body 
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal mengambil data gempa dari BMKG." }, { quoted: m });
    }
  }
};
