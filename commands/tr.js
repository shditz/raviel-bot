const TRANSLAPP_API = "https://puruboy-api.vercel.app/api/ai/translapp";

module.exports = {
  name: "tr",
  aliases: ["translate"],
  description: "Menerjemahkan teks antar bahasa secara otomatis menggunakan teknologi AI.",
  async execute(sock, m, args, {jid}) {
    if (!args.length || args.length < 2) {
      return await sock.sendMessage(
        jid,
        {
          text: `❌ *FORMAT SALAH*\n\nGunakan format: *!tr <bahasa_tujuan> <teks>*\n\n*Contoh:* \n!tr english Halo apa kabar?\n!tr jepang Selamat pagi`,
        },
        {quoted: m},
      );
    }

    const targetLang = args[0];
    const text = args.slice(1).join(" ");

    await sock.sendMessage(jid, {text: "⏳ *MENERJEMAHKAN...*\n\nSedang memproses teks Anda, mohon tunggu sebentar."}, {quoted: m});

    try {
      const response = await fetch(TRANSLAPP_API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          text: text,
          module: "TRANSLATE",
          to: targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error(`Koneksi API Gagal (${response.status})`);
      }

      const data = await response.json();

      if (!data.success || !data.result?.output) {
        return await sock.sendMessage(
          jid,
          {text: "❌ *GAGAL*\n\nSistem tidak dapat menerjemahkan teks tersebut. Pastikan bahasa tujuan ditulis dengan benar."},
          {quoted: m},
        );
      }

      await sock.sendMessage(
        jid,
        {
          text: `🌐 *TERJEMAHAN AI*\n\n` +
                `🏳️ *Bahasa:* ${data.result.to.toUpperCase()}\n` +
                `────────────────────\n` +
                `📝 *Input:* \n_${data.result.input}_\n\n` +
                `✅ *Hasil:* \n*${data.result.output}*\n` +
                `────────────────────`,
        },
        {quoted: m},
      );
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi server penerjemah. Silakan coba kembali nanti."}, {quoted: m});
    }
  },
};
