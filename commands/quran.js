module.exports = {
  name: "quran",
  aliases: ["alquran"],
  description: "Membaca ayat Al-Quran. Gunakan: !quran <nomor_surah> <nomor_ayat>",
  async execute(sock, m, args, { jid }) {
    if (args.length < 2) {
      return await sock.sendMessage(jid, { text: "❌ Format salah. Gunakan: !quran <nomor_surah> <nomor_ayat>\nContoh: !quran 1 1" }, { quoted: m });
    }

    const surah = args[0];
    const ayah = args[1];

    try {
      const res = await fetch(`https://puruboy-api.vercel.app/api/tools/quran?surah=${surah}&ayah=${ayah}`);
      const data = await res.json();

      if (!data.success || !data.result.data || data.result.data.length === 0) {
        return await sock.sendMessage(jid, { text: `❌ Ayat tidak ditemukan. Pastikan nomor surah dan ayat benar.` }, { quoted: m });
      }

      const info = data.result.info;
      const verses = data.result.data;

      let body = `📖 *Al-Qur'anul Karim*\n\n` +
                 `🕌 *Surah:* ${info.nama_latin} (${info.arti})\n` +
                 `🔢 *Nomor Surah:* ${info.nomor_surah}\n` +
                 `📑 *Total Ayat:* ${info.total_ayat}\n\n` +
                 `─── *Ayat yang dicari* ───\n\n`;

      for (let v of verses) {
        body += `✨ *Ayat ${v.ayah}*\n` +
                `*${v.arabic}*\n\n` +
                `_${v.latin}_\n\n` +
                `💬 *Arti:* ${v.translation}\n\n` +
                `──────────────────\n\n`;
      }

      await sock.sendMessage(jid, { text: body }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal mengambil data Al-Quran." }, { quoted: m });
    }
  }
};
