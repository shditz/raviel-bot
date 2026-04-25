const TRANSLAPP_API = "https://puruboy-api.vercel.app/api/ai/translapp";

module.exports = {
  name: "expand",
  aliases: ["perluas", "lengkap"],
  description: "Memperluas teks pendek menjadi penjelasan yang lebih detail dan komprehensif menggunakan AI.",
  async execute(sock, m, args, {jid}) {
    const text = args.join(" ");

    if (!text) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *MASUKKAN TEKS*\n\nSilakan masukkan teks atau poin-poin yang ingin Anda perluas penjelasannya!\n*Contoh:* !expand Pentingnya pendidikan bagi anak."},
        {quoted: m},
      );
    }

    await sock.sendMessage(jid, {text: "⏳ *MEMPROSES...*\n\nSedang menyusun penjelasan yang lebih mendalam berdasarkan teks Anda."}, {quoted: m});

    try {
      const response = await fetch(TRANSLAPP_API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          text: text,
          module: "EXPAND",
        }),
      });

      if (!response.ok) {
        throw new Error(`Koneksi API Gagal (${response.status})`);
      }

      const data = await response.json();

      if (!data.success || !data.result?.output) {
        return await sock.sendMessage(
          jid,
          {text: "❌ *GAGAL*\n\nSistem tidak dapat memperluas teks tersebut saat ini."},
          {quoted: m},
        );
      }

      await sock.sendMessage(
        jid,
        {
          text: `📖 *PERLUASAN TEKS AI*\n\n` +
                `📝 *Teks Asal:* \n_${data.result.input}_\n\n` +
                `✅ *Hasil Pengembangan:* \n*${data.result.output}*\n\n` +
                `────────────────────\n` +
                `_Gunakan hasil ini untuk mendapatkan ide tulisan yang lebih lengkap._`,
        },
        {quoted: m},
      );
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi server AI Expand. Silakan coba kembali nanti."}, {quoted: m});
    }
  },
};
