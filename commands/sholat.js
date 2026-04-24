module.exports = {
  name: "sholat",
  aliases: ["jadwalsholat"],
  description: "Cek jadwal sholat berdasarkan kota.",
  async execute(sock, m, args, { jid }) {
    const city = args.join(" ") || "jakarta";
    
    try {
      const res = await fetch(`https://puruboy-api.vercel.app/api/tools/sholat?q=${encodeURIComponent(city)}`);
      const data = await res.json();

      if (!data.success || !data.result.data || data.result.data.length === 0) {
        return await sock.sendMessage(jid, { text: `❌ Jadwal sholat untuk kota *${city}* tidak ditemukan.` }, { quoted: m });
      }

      const todayDate = new Date().getDate().toString().padStart(2, "0");
      const today = data.result.data.find(d => d.tanggal === todayDate) || data.result.data[0];
      const matchedCity = data.result.matchedCity || city;

      const body = 
        `🕌 *Jadwal Sholat - ${matchedCity}*\n` +
        `📅 *Tanggal:* ${today.tanggal} (Bulan: ${data.result.monthYear})\n\n` +
        `☁️ Imsyak   : *${today.imsyak}*\n` +
        `🌅 Shubuh   : *${today.shubuh}*\n` +
        `☀️ Terbit   : *${today.terbit}*\n` +
        `🔆 Dhuha    : *${today.dhuha}*\n` +
        `☀️ Dzuhur   : *${today.dzuhur}*\n` +
        `⛅ Ashr     : *${today.ashr}*\n` +
        `🌇 Maghrib  : *${today.maghrib}*\n` +
        `🌙 Isya     : *${today.isya}*\n\n` +
        `_Ketuk jari Anda untuk beribadah tepat waktu._`;

      await sock.sendMessage(jid, { text: body }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal mengambil jadwal sholat." }, { quoted: m });
    }
  }
};
