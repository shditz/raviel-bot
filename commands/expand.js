const TRANSLAPP_API = "https://puruboy-api.vercel.app/api/ai/translapp";

module.exports = {
  name: "expand",
  aliases: ["perluas", "lengkap"],
  description: "Perluas teks dengan penjelasan lebih detail. Gunakan: !expand <teks>",
  async execute(sock, m, args, {jid}) {
    const text = args.join(" ");

    if (!text) {
      return await sock.sendMessage(
        jid,
        {text: "❌ Masukkan teks yang ingin diperluas!\n\nGunakan: !expand <teks>"},
        {quoted: m},
      );
    }

    await sock.sendMessage(jid, {text: "📈 Memperluas teks..."}, {quoted: m});

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
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.result?.output) {
        return await sock.sendMessage(
          jid,
          {text: "❌ Gagal memperluas teks. Coba lagi nanti!"},
          {quoted: m},
        );
      }

      await sock.sendMessage(
        jid,
        {
          text: `📖 *Perluasan Teks*\n\n📝 *Original:*\n${data.result.input}\n\n✅ *Hasil:*\n${data.result.output}`,
        },
        {quoted: m},
      );
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ Terjadi kesalahan. Coba lagi nanti!"}, {quoted: m});
    }
  },
};
