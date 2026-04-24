const wilayah = require("../data/wilayah.json");

module.exports = {
  name: "cuaca",
  description: "Cek prakiraan cuaca dari BMKG. Gunakan: !cuaca <nama_kota>",
  async execute(sock, m, args, { jid }) {
    const query = args.join(" ").toLowerCase().trim();
    if (!query) {
      return await sock.sendMessage(jid, { text: "❌ Masukkan nama kota! Contoh: !cuaca Jakarta" }, { quoted: m });
    }

    // Cari kode adm4 dari mapping
    const adm4 = wilayah[query];
    if (!adm4) {
      const available = Object.keys(wilayah).slice(0, 20).join(", ");
      return await sock.sendMessage(jid, {
        text: `❌ Kota *${query}* tidak ditemukan dalam database BMKG.\n\n📋 Contoh kota tersedia:\n${available}...`
      }, { quoted: m });
    }

    try {
      const res = await fetch(`https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${adm4}`);
      if (!res.ok) {
        return await sock.sendMessage(jid, { text: "❌ Gagal menghubungi server BMKG." }, { quoted: m });
      }
      const data = await res.json();

      if (!data.data || !data.data[0] || !data.data[0].cuaca) {
        return await sock.sendMessage(jid, { text: "❌ Data cuaca tidak tersedia untuk wilayah ini." }, { quoted: m });
      }

      const lokasi = data.lokasi;
      // Ambil prakiraan cuaca terdekat (jam pertama dari hari pertama)
      const allForecasts = data.data[0].cuaca.flat();

      // Cari prakiraan yang paling dekat dengan waktu sekarang
      const now = new Date();
      let closest = allForecasts[0];
      let closestDiff = Infinity;

      for (const f of allForecasts) {
        const fTime = new Date(f.local_datetime);
        const diff = Math.abs(now - fTime);
        if (diff < closestDiff) {
          closestDiff = diff;
          closest = f;
        }
      }

      const body =
        `🌤️ *Prakiraan Cuaca BMKG*\n\n` +
        `📍 *Lokasi:* ${lokasi.desa}, ${lokasi.kecamatan}\n` +
        `🏙️ *Kota:* ${lokasi.kotkab}, ${lokasi.provinsi}\n` +
        `⏰ *Waktu:* ${closest.local_datetime}\n\n` +
        `🌡️ *Suhu:* ${closest.t}°C\n` +
        `☁️ *Kondisi:* ${closest.weather_desc}\n` +
        `💧 *Kelembaban:* ${closest.hu}%\n` +
        `💨 *Kec. Angin:* ${closest.ws} km/jam\n` +
        `🧭 *Arah Angin:* dari ${closest.wd}\n` +
        `☁️ *Tutupan Awan:* ${closest.tcc}%\n` +
        `👁️ *Jarak Pandang:* ${closest.vs_text}\n\n` +
        `_Sumber: Data Resmi BMKG_`;

      await sock.sendMessage(jid, { text: body }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal mengambil data cuaca dari BMKG." }, { quoted: m });
    }
  }
};
