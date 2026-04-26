const {LRUCache} = require("../utils/cache");

const GEMINI_API = "https://puruboy-api.vercel.app/api/ai/gemini-v2";
const kbbiCache = new LRUCache(100, 600000);

module.exports = {
  name: "kbbi",
  description: "Mencari definisi kata resmi di Kamus Besar Bahasa Indonesia (KBBI).",
  async execute(sock, m, args, {jid}) {
    const query = args.join(" ").toLowerCase().trim();
    if (!query) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *MASUKKAN KATA*\n\nSilakan masukkan kata yang ingin Anda cari definisinya!\n*Contoh:* !kbbi rumah"},
        {quoted: m},
      );
    }

    try {
      const cacheKey = `kbbi:${query}`;
      const cachedResult = kbbiCache.get(cacheKey);
      if (cachedResult) {
        return await sock.sendMessage(jid, {text: cachedResult}, {quoted: m});
      }

      await sock.sendMessage(jid, {text: "🔍 *MENCARI DI KBBI...*\n\nSedang mengambil definisi kata dari pangkalan data resmi KBBI, mohon tunggu."}, {quoted: m});

      const prompt = `Berikan definisi kata "${query}" sesuai dengan Kamus Besar Bahasa Indonesia (KBBI). Kamu adalah sistem KBBI yang akurat. Berikan jawaban dalam format teks saja tanpa menyebutkan AI atau Gemini. Format harus persis seperti ini:
📖 *KAMUS BESAR BAHASA INDONESIA*
🔎 *Kata:* ${query.toUpperCase()}
────────────────────
1. [Definisi 1]
2. [Definisi 2]
...
────────────────────
_Sumber: Data Resmi KBBI_`;

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
          {text: `❌ *TIDAK DITEMUKAN*\n\nKata *${query.toUpperCase()}* tidak ditemukan atau terjadi kesalahan saat mengambil data.`},
          {quoted: m},
        );
      }

      let body = data.result.answer;

      kbbiCache.set(cacheKey, body);

      await sock.sendMessage(jid, {text: body}, {quoted: m});
    } catch (err) {
      console.error(err);
      await sock.sendMessage(
        jid,
        {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kesalahan saat mengambil data KBBI. Silakan coba beberapa saat lagi."},
        {quoted: m},
      );
    }
  },
};
