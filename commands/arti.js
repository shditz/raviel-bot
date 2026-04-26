const {LRUCache} = require("../utils/cache");

const GEMINI_API = "https://puruboy-api.vercel.app/api/ai/gemini-v2";
const artiCache = new LRUCache(100, 600000);

module.exports = {
  name: "arti",
  aliases: ["makna", "definisi"],
  description: "Mencari arti atau makna dari suatu istilah atau kata.",
  async execute(sock, m, args, {jid}) {
    const query = args.join(" ").trim();
    if (!query) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *MASUKKAN ISTILAH*\n\nSilakan masukkan istilah yang ingin Anda cari artinya!\n*Contoh:* !arti ghosting"},
        {quoted: m},
      );
    }

    try {
      const cacheKey = `arti:${query.toLowerCase()}`;
      const cachedResult = artiCache.get(cacheKey);
      if (cachedResult) {
        return await sock.sendMessage(jid, {text: cachedResult}, {quoted: m});
      }

      await sock.sendMessage(jid, {text: "📖 *MENCARI MAKNA...*\n\nSedang menganalisis arti dari istilah tersebut, mohon tunggu sebentar."}, {quoted: m});

      const prompt = `Berikan arti atau makna dari istilah "${query}". Jika itu bahasa gaul, jelaskan konteksnya. Jika istilah umum, berikan definisi yang jelas. Jangan sebutkan kamu adalah AI. Format harus persis seperti ini:
📖 *ARTI & MAKNA ISTILAH*
🔎 *Istilah:* ${query}
────────────────────
📝 *Makna:*
[Penjelasan]
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
          {text: `❌ *TIDAK DITEMUKAN*\n\nIstilah *${query}* tidak dapat dijelaskan saat ini.`},
          {quoted: m},
        );
      }

      const body = data.result.answer;
      artiCache.set(cacheKey, body);

      await sock.sendMessage(jid, {text: body}, {quoted: m});
    } catch (err) {
      console.error(err);
      await sock.sendMessage(
        jid,
        {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat memproses data. Silakan coba kembali nanti."},
        {quoted: m},
      );
    }
  },
};
