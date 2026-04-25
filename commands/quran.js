module.exports = {
  name: "quran",
  aliases: ["alquran"],
  description: "Membaca ayat suci Al-Quran beserta terjemahan dan latinnnya secara digital.",
  async execute(sock, m, args, { jid }) {
    if (args.length < 2) {
      return await sock.sendMessage(jid, { text: "❌ *FORMAT SALAH*\n\nGunakan format: *!quran <nomor_surah> <nomor_ayat>*\n*Contoh:* !quran 1 1 (Al-Fatihah ayat 1)" }, { quoted: m });
    }

    const surah = args[0];
    const ayah = args[1];

    try {
      const res = await fetch(`https://puruboy-api.vercel.app/api/tools/quran?surah=${surah}&ayah=${ayah}`);
      const data = await res.json();

      if (!data.success || !data.result.data || data.result.data.length === 0) {
        return await sock.sendMessage(jid, { text: `❌ *TIDAK DITEMUKAN*\n\nAyat atau Surah tersebut tidak ditemukan. Pastikan nomor yang Anda masukkan benar.` }, { quoted: m });
      }

      const info = data.result.info;
      const verses = data.result.data;

      let body = `📖 *AL-QUR'AN DIGITAL*\n\n` +
                 `🕌 *Surah:* ${info.nama_latin} (${info.arti})\n` +
                 `🔢 *Nomor:* ${info.nomor_surah}\n` +
                 `📑 *Total Ayat:* ${info.total_ayat}\n` +
                 `────────────────────\n\n`;

      for (let v of verses) {
        body += `✨ *Ayat ${v.ayah}*\n\n` +
                `${v.arabic}\n\n` +
                `_${v.latin}_\n\n` +
                `💬 *Arti:* \n${v.translation}\n\n` +
                `────────────────────\n\n`;
      }

      await sock.sendMessage(jid, { text: body }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat mengambil data Al-Quran. Silakan coba kembali nanti." }, { quoted: m });
    }
  }
};
