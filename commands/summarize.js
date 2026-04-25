const TRANSLAPP_API = "https://puruboy-api.vercel.app/api/ai/translapp";

module.exports = {
  name: "summarize",
  aliases: ["summary", "ringkas"],
  description: "Meringkas teks yang panjang menjadi poin-poin inti atau rangkuman singkat menggunakan AI.",
  async execute(sock, m, args, {jid}) {
    const text = args.join(" ");

    if (!text) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *MASUKKAN TEKS*\n\nSilakan masukkan teks atau artikel panjang yang ingin Anda ringkas!\n*Contoh:* !summarize <artikel berita>"},
        {quoted: m},
      );
    }

    await sock.sendMessage(jid, {text: "⏳ *MERINGKAS...*\n\nSedang mengekstraksi intisari dan poin-poin penting dari teks Anda."}, {quoted: m});

    try {
      const response = await fetch(TRANSLAPP_API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          text: text,
          module: "SUMMARIZE",
        }),
      });

      if (!response.ok) {
        throw new Error(`Koneksi API Gagal (${response.status})`);
      }

      const data = await response.json();

      if (!data.success || !data.result?.output) {
        return await sock.sendMessage(
          jid,
          {text: "❌ *GAGAL*\n\nSistem tidak dapat meringkas teks tersebut saat ini."},
          {quoted: m},
        );
      }

      await sock.sendMessage(
        jid,
        {text: `📋 *RINGKASAN TEKS AI*\n\n` +
               `✅ *Hasil Rangkuman:* \n\n${data.result.output}\n\n` +
               `────────────────────\n` +
               `_Ringkasan ini dibuat otomatis menggunakan AI._`
        },
        {quoted: m},
      );
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi server AI Ringkas. Silakan coba kembali nanti."}, {quoted: m});
    }
  },
};
