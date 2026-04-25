const TRANSLAPP_API = "https://puruboy-api.vercel.app/api/ai/translapp";

module.exports = {
  name: "grammar",
  aliases: ["tata", "spellcheck"],
  description: "Perbaiki tata bahasa dan ejaan teks. Gunakan: !grammar <teks>",
  async execute(sock, m, args, {jid}) {
    const text = args.join(" ");

    if (!text) {
      return await sock.sendMessage(
        jid,
        {text: "❌ Masukkan teks yang ingin diperbaiki!\n\nGunakan: !grammar <teks>"},
        {quoted: m},
      );
    }

    await sock.sendMessage(jid, {text: "✅ Memeriksa tata bahasa..."}, {quoted: m});

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
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.result?.output) {
        return await sock.sendMessage(
          jid,
          {text: "❌ Gagal memeriksa tata bahasa. Coba lagi nanti!"},
          {quoted: m},
        );
      }

      await sock.sendMessage(
        jid,
        {
          text: `🔤 *Perbaikan Tata Bahasa*\n\n📝 *Original:*\n${data.result.input}\n\n✅ *Diperbaiki:*\n${data.result.output}`,
        },
        {quoted: m},
      );
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ Terjadi kesalahan. Coba lagi nanti!"}, {quoted: m});
    }
  },
};
