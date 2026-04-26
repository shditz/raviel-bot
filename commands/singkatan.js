const {LRUCache} = require("../utils/cache");

const GEMINI_API = "https://puruboy-api.vercel.app/api/ai/gemini-v2";
const singkatanCache = new LRUCache(100, 600000);

module.exports = {
  name: "singkatan",
  aliases: ["kepanjangan"],
  description: "Mencari kepanjangan dan arti dari suatu singkatan.",
  async execute(sock, m, args, {jid}) {
    const query = args.join(" ").trim();
    if (!query) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *MASUKKAN SINGKATAN*\n\nSilakan masukkan singkatan yang ingin Anda cari kepanjangannya!\n*Contoh:* !singkatan bumn"},
        {quoted: m},
      );
    }

    try {
      const cacheKey = `singkatan:${query.toLowerCase()}`;
      const cachedResult = singkatanCache.get(cacheKey);
      if (cachedResult) {
        return await sock.sendMessage(jid, {text: cachedResult}, {quoted: m});
      }

      await sock.sendMessage(jid, {text: "🔡 *MENCARI SINGKATAN...*\n\nSedang mencari kepanjangan dan konteks singkatan tersebut, mohon tunggu sebentar."}, {quoted: m});

      const prompt = `Berikan kepanjangan dan arti dari singkatan "${query}". Berikan beberapa versi jika ada. Jangan sebutkan kamu adalah AI. Format harus persis seperti ini:
🔡 *KAMUS SINGKATAN*
🔎 *Singkatan:* ${query.toUpperCase()}
────────────────────
📌 *Kepanjangan:*
[Kepanjangan]

📝 *Arti/Konteks:*
[Penjelasan singkat mengenai penggunaannya]
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
          {text: `❌ *TIDAK DITEMUKAN*\n\nSingkatan *${query.toUpperCase()}* tidak ditemukan.`},
          {quoted: m},
        );
      }

      const body = data.result.answer;
      singkatanCache.set(cacheKey, body);

      await sock.sendMessage(jid, {text: body}, {quoted: m});
    } catch (err) {
      console.error(err);
      await sock.sendMessage(
        jid,
        {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat memproses data singkatan. Silakan coba kembali nanti."},
        {quoted: m},
      );
    }
  },
};
