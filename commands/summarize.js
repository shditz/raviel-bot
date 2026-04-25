const TRANSLAPP_API = "https://puruboy-api.vercel.app/api/ai/translapp";

module.exports = {
  name: "summarize",
  aliases: ["summary", "ringkas"],
  description: "Ringkas teks panjang menjadi intisari singkat. Gunakan: !summarize <teks>",
  async execute(sock, m, args, {jid}) {
    const text = args.join(" ");

    if (!text) {
      return await sock.sendMessage(
        jid,
        {text: "❌ Masukkan teks yang ingin diringkas!\n\nGunakan: !summarize <teks>"},
        {quoted: m},
      );
    }

    await sock.sendMessage(jid, {text: "🔍 Meringkas teks..."}, {quoted: m});

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
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.result?.output) {
        return await sock.sendMessage(
          jid,
          {text: "❌ Gagal meringkas teks. Coba lagi nanti!"},
          {quoted: m},
        );
      }

      await sock.sendMessage(
        jid,
        {text: `📋 *Ringkasan Teks*\n\n✅ *Hasil:*\n${data.result.output}`},
        {quoted: m},
      );
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ Terjadi kesalahan. Coba lagi nanti!"}, {quoted: m});
    }
  },
};
