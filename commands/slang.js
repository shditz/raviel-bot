const {LRUCache} = require("../utils/cache");

const GEMINI_API = "https://puruboy-api.vercel.app/api/ai/gemini-v2";
const slangCache = new LRUCache(100, 600000);

module.exports = {
  name: "slang",
  aliases: ["gaul", "kamusgaul"],
  description: "Mencari arti kata gaul atau slang masa kini.",
  async execute(sock, m, args, {jid}) {
    const query = args.join(" ").trim();
    if (!query) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *MASUKKAN KATA GAUL*\n\nSilakan masukkan kata gaul yang ingin Anda cari artinya!\n*Contoh:* !slang fomo"},
        {quoted: m},
      );
    }

    try {
      const cacheKey = `slang:${query.toLowerCase()}`;
      const cachedResult = slangCache.get(cacheKey);
      if (cachedResult) {
        return await sock.sendMessage(jid, {text: cachedResult}, {quoted: m});
      }

      await sock.sendMessage(jid, {text: "🔥 *MENCARI ARTI SLANG...*\n\nSedang menelusuri kamus bahasa gaul, mohon tunggu sebentar."}, {quoted: m});

      const prompt = `Berikan arti dari bahasa gaul atau slang "${query}". Jelaskan dengan gaya yang mudah dimengerti. Berikan contoh kalimatnya. Jangan sebutkan kamu adalah AI. Format:
🔥 *KAMUS GAUL & SLANG*
🔎 *Kata:* ${query}
────────────────────
📝 *Arti:*
[Penjelasan]

💡 *Contoh:*
"[Contoh Kalimat]"
────────────────────`;

      const response = await fetch(GEMINI_API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({prompt: prompt}),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Koneksi API Gagal (${response.status})`);
      }

      const data = await response.json();

      if (!data.success || !data.result?.answer) {
        return await sock.sendMessage(
          jid,
          {text: `❌ *TIDAK DITEMUKAN*\n\nKata gaul *${query}* tidak ditemukan atau terjadi kesalahan.`},
          {quoted: m},
        );
      }

      const body = data.result.answer;
      slangCache.set(cacheKey, body);

      await sock.sendMessage(jid, {text: body}, {quoted: m});
    } catch (err) {
      console.error(err);
      await sock.sendMessage(
        jid,
        {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat memproses data slang. Silakan coba kembali nanti."},
        {quoted: m},
      );
    }
  },
};
