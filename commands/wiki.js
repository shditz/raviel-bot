const {LRUCache} = require("../utils/cache");

const GEMINI_API = "https://puruboy-api.vercel.app/api/ai/gemini-v2";
const wikiCache = new LRUCache(100, 600000);

module.exports = {
  name: "wiki",
  aliases: ["wikipedia"],
  description: "Mencari informasi lengkap di ensiklopedia Wikipedia Indonesia.",
  async execute(sock, m, args, { jid }) {
    const query = args.join(" ");
    if (!query) {
      return await sock.sendMessage(jid, { text: "❌ *MASUKKAN TOPIK*\n\nSilakan masukkan topik yang ingin Anda cari di Wikipedia!\n*Contoh:* !wiki Albert Einstein" }, { quoted: m });
    }

    try {
      const cacheKey = `wiki:${query.toLowerCase()}`;
      const cachedResult = wikiCache.get(cacheKey);
      if (cachedResult) {
        return await sock.sendMessage(jid, { text: cachedResult }, { quoted: m });
      }

      await sock.sendMessage(jid, { text: "📚 *MENCARI DI WIKIPEDIA...*\n\nSedang mengumpulkan informasi lengkap dari Wikipedia Indonesia, mohon tunggu sebentar." }, { quoted: m });

      const prompt = `Berikan informasi lengkap dan ringkas mengenai "${query}" layaknya ensiklopedia Wikipedia Indonesia. Kamu adalah ensiklopedia digital yang akurat. Berikan jawaban dalam format teks saja tanpa menyebutkan AI atau Gemini. Format harus persis seperti ini:
📚 *WIKIPEDIA INDONESIA*
📌 *Topik:* ${query}
────────────────────
[Ringkasan Informasi yang mendalam namun padat]

🔗 *Link Lengkap:* https://id.wikipedia.org/wiki/${query.replace(/ /g, '_')}
────────────────────`;

      const response = await fetch(GEMINI_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Koneksi API Gagal (${response.status})`);
      }

      const data = await response.json();

      if (!data.success || !data.result?.answer) {
        return await sock.sendMessage(jid, { text: `❌ *TIDAK DITEMUKAN*\n\nTopik *${query}* tidak dapat ditemukan atau terjadi kesalahan.` }, { quoted: m });
      }

      const body = data.result.answer;
      wikiCache.set(cacheKey, body);

      await sock.sendMessage(jid, { text: body }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat memproses data Wikipedia. Silakan coba kembali nanti." }, { quoted: m });
    }
  }
};
