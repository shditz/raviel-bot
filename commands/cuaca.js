const wilayah = require("../data/wilayah.json");

module.exports = {
  name: "cuaca",
  description: "Cek prakiraan cuaca akurat di wilayah Anda berdasarkan data resmi BMKG.",
  async execute(sock, m, args, { jid }) {
    const query = args.join(" ").toLowerCase().trim();
    if (!query) {
      return await sock.sendMessage(jid, { text: "❌ *MASUKKAN KOTA*\n\nSilakan masukkan nama kota atau daerah Anda!\n*Contoh:* !cuaca Jakarta" }, { quoted: m });
    }

    const adm4 = wilayah[query];
    if (!adm4) {
      const available = Object.keys(wilayah).slice(0, 10).join(", ");
      return await sock.sendMessage(jid, {
        text: `❌ *DAERAH TIDAK DITEMUKAN*\n\nKota *${query}* tidak terdaftar dalam database prakiraan BMKG kami.\n\n📋 *Contoh kota tersedia:* \n${available}...`
      }, { quoted: m });
    }

    try {
      const res = await fetch(`https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${adm4}`);
      if (!res.ok) {
        return await sock.sendMessage(jid, { text: "❌ *KESALAHAN KONEKSI*\n\nGagal menghubungi server resmi BMKG." }, { quoted: m });
      }
      const data = await res.json();

      if (!data.data || !data.data[0] || !data.data[0].cuaca) {
        return await sock.sendMessage(jid, { text: "❌ *DATA KOSONG*\n\nInformasi cuaca untuk wilayah ini sedang tidak tersedia." }, { quoted: m });
      }

      const lokasi = data.lokasi;
      const allForecasts = data.data[0].cuaca.flat();

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
        `🌤️ *PRAKIRAAN CUACA BMKG*\n\n` +
        `📍 *Lokasi:* ${lokasi.desa}, ${lokasi.kecamatan}\n` +
        `🏙️ *Wilayah:* ${lokasi.kotkab}, ${lokasi.provinsi}\n` +
        `────────────────────\n` +
        `🌡️ *Suhu:* ${closest.t}°C\n` +
        `☁️ *Kondisi:* ${closest.weather_desc}\n` +
        `💧 *Kelembaban:* ${closest.hu}%\n` +
        `💨 *Kec. Angin:* ${closest.ws} km/jam\n` +
        `🧭 *Arah Angin:* ${closest.wd}\n` +
        `👁️ *Jarak Pandang:* ${closest.vs_text}\n` +
        `────────────────────\n` +
        `⏰ *Waktu:* ${closest.local_datetime}\n` +
        `_Sumber: Data Resmi BMKG_`;

      await sock.sendMessage(jid, { text: body }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat memproses data cuaca. Silakan coba kembali nanti." }, { quoted: m });
    }
  }
};
