const TRANSLAPP_API = "https://puruboy-api.vercel.app/api/ai/translapp";

module.exports = {
  name: "paraphrase",
  aliases: ["parafrasa", "ulang"],
  description: "Tulis ulang teks dengan kata-kata yang berbeda. Gunakan: !paraphrase <teks>",
  async execute(sock, m, args, {jid}) {
    const text = args.join(" ");

    if (!text) {
      return await sock.sendMessage(
        jid,
        {text: "❌ Masukkan teks yang ingin diparafrase!\n\nGunakan: !paraphrase <teks>"},
        {quoted: m},
      );
    }

    await sock.sendMessage(jid, {text: "✏️ Menulis ulang teks..."}, {quoted: m});

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
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.result?.output) {
        return await sock.sendMessage(
          jid,
          {text: "❌ Gagal menulis ulang teks. Coba lagi nanti!"},
          {quoted: m},
        );
      }

      await sock.sendMessage(
        jid,
        {
          text: `✍️ *Parafrase Teks*\n\n📝 *Original:*\n${data.result.input}\n\n✅ *Hasil:*\n${data.result.output}`,
        },
        {quoted: m},
      );
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ Terjadi kesalahan. Coba lagi nanti!"}, {quoted: m});
    }
  },
};
