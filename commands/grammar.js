const TRANSLAPP_API = "https://puruboy-api.vercel.app/api/ai/translapp";

module.exports = {
  name: "grammar",
  aliases: ["tata", "spellcheck"],
  description: "Memperbaiki tata bahasa (grammar) dan ejaan teks secara otomatis menggunakan AI.",
  async execute(sock, m, args, {jid}) {
    const text = args.join(" ");

    if (!text) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *MASUKKAN TEKS*\n\nSilakan masukkan kalimat yang ingin Anda periksa tata bahasanya!\n*Contoh:* !grammar saya pergi ke pasar kemarin"},
        {quoted: m},
      );
    }

    await sock.sendMessage(jid, {text: "⏳ *MEMERIKSA...*\n\nSedang menganalisis struktur kalimat dan ejaan teks Anda."}, {quoted: m});

    try {
      const response = await fetch(TRANSLAPP_API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          text: text,
          module: "GRAMMAR",
        }),
      });

      if (!response.ok) {
        throw new Error(`Koneksi API Gagal (${response.status})`);
      }

      const data = await response.json();

      if (!data.success || !data.result?.output) {
        return await sock.sendMessage(
          jid,
          {text: "❌ *GAGAL*\n\nSistem tidak dapat memproses teks tersebut saat ini."},
          {quoted: m},
        );
      }

      await sock.sendMessage(
        jid,
        {
          text: `🔤 *PERBAIKAN TATA BAHASA*\n\n` +
                `📝 *Teks Asal:* \n_${data.result.input}_\n\n` +
                `✅ *Hasil Perbaikan:* \n*${data.result.output}*\n\n` +
                `────────────────────\n` +
                `_Gunakan hasil di atas untuk tulisan yang lebih profesional._`,
        },
        {quoted: m},
      );
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi server AI Grammar. Silakan coba kembali nanti."}, {quoted: m});
    }
  },
};
