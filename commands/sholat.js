module.exports = {
  name: "sholat",
  aliases: ["jadwalsholat"],
  description: "Menampilkan jadwal ibadah sholat 5 waktu untuk wilayah tertentu.",
  async execute(sock, m, args, { jid }) {
    const city = args.join(" ") || "jakarta";
    
    try {
      const res = await fetch(`https://puruboy-api.vercel.app/api/tools/sholat?q=${encodeURIComponent(city)}`);
      const data = await res.json();

      if (!data.success || !data.result.data || data.result.data.length === 0) {
        return await sock.sendMessage(jid, { text: `❌ *KOTA TIDAK DITEMUKAN*\n\nMaaf, jadwal sholat untuk kota *${city}* tidak tersedia.` }, { quoted: m });
      }

      const todayDate = new Date().getDate().toString().padStart(2, "0");
      const today = data.result.data.find(d => d.tanggal === todayDate) || data.result.data[0];
      const matchedCity = data.result.matchedCity || city;

      const body = 
        `🕌 *JADWAL SHOLAT WILAYAH*\n\n` +
        `📍 *Kota:* ${matchedCity.toUpperCase()}\n` +
        `📅 *Tanggal:* ${today.tanggal} (${data.result.monthYear})\n` +
        `────────────────────\n\n` +
        `☁️ *Imsyak:* ${today.imsyak}\n` +
        `🌅 *Shubuh:* ${today.shubuh}\n` +
        `☀️ *Terbit:* ${today.terbit}\n` +
        `🔆 *Dhuha:* ${today.dhuha}\n` +
        `☀️ *Dzuhur:* ${today.dzuhur}\n` +
        `⛅ *Ashr:* ${today.ashr}\n` +
        `🌇 *Maghrib:* ${today.maghrib}\n` +
        `🌙 *Isya:* ${today.isya}\n\n` +
        `────────────────────\n` +
        `_Ketuk jari Anda untuk beribadah tepat waktu._`;

      await sock.sendMessage(jid, { text: body }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat mengambil data jadwal sholat. Silakan coba kembali nanti." }, { quoted: m });
    }
  }
};
