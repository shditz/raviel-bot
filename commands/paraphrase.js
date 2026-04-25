const TRANSLAPP_API = "https://puruboy-api.vercel.app/api/ai/translapp";

module.exports = {
  name: "paraphrase",
  aliases: ["parafrasa", "ulang"],
  description: "Menulis ulang (parafrase) teks dengan gaya bahasa yang berbeda namun tetap mempertahankan inti pesan.",
  async execute(sock, m, args, {jid}) {
    const text = args.join(" ");

    if (!text) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *MASUKKAN TEKS*\n\nSilakan masukkan teks yang ingin Anda tulis ulang (parafrase)!\n*Contoh:* !paraphrase Teknologi AI berkembang sangat pesat saat ini."},
        {quoted: m},
      );
    }

    await sock.sendMessage(jid, {text: "⏳ *MEMPROSES...*\n\nSedang menulis ulang teks Anda dengan pilihan kata yang lebih bervariasi."}, {quoted: m});

    try {
      const response = await fetch(TRANSLAPP_API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          text: text,
          module: "PARAPHRASE",
        }),
      });

      if (!response.ok) {
        throw new Error(`Koneksi API Gagal (${response.status})`);
      }

      const data = await response.json();

      if (!data.success || !data.result?.output) {
        return await sock.sendMessage(
          jid,
          {text: "❌ *GAGAL*\n\nSistem tidak dapat memproses parafrase untuk teks tersebut saat ini."},
          {quoted: m},
        );
      }

      await sock.sendMessage(
        jid,
        {
          text: `✍️ *PARAFRASE TEKS*\n\n` +
                `📝 *Teks Asal:* \n_${data.result.input}_\n\n` +
                `✅ *Hasil Parafrase:* \n*${data.result.output}*\n\n` +
                `────────────────────\n` +
                `_Gunakan hasil ini untuk menghindari plagiarisme._`,
        },
        {quoted: m},
      );
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi server AI Parafrase. Silakan coba kembali nanti."}, {quoted: m});
    }
  },
};
