const {LRUCache} = require("../utils/cache");

const kbbiCache = new LRUCache(100, 300000);

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

      const api1 = fetch(
        `https://api.lolhuman.xyz/api/kbbi?apikey=GatauDeh&query=${encodeURIComponent(query)}`,
        {
          signal: AbortSignal.timeout(5000),
        },
      ).then((r) => (r.ok ? r.json() : Promise.reject("API1 failed")));

      const api2 = fetch(
        `https://kbbi-api-zhirrr.vercel.app/api/kbbi?text=${encodeURIComponent(query)}`,
        {
          signal: AbortSignal.timeout(5000),
        },
      ).then((r) => {
        if (!r.ok) return Promise.reject("API2 failed");
        const contentType = r.headers.get("content-type") || "";
        if (!contentType.includes("application/json"))
          return Promise.reject("Invalid content type");
        return r.json();
      });

      const data = await Promise.race([api1, api2]).catch(() => {
        return Promise.allSettled([api1, api2]).then((results) => {
          const succeeded = results.find((r) => r.status === "fulfilled");
          if (succeeded) return succeeded.value;
          throw new Error("All APIs failed");
        });
      });

      let result = null;
      if (data?.result) {
        result = data.result;
      } else if (data?.data?.result) {
        result = data.data.result;
      }

      if (!result) {
        return await sock.sendMessage(
          jid,
          {text: `❌ *TIDAK DITEMUKAN*\n\nKata *${query.toUpperCase()}* tidak ditemukan dalam pangkalan data KBBI.`},
          {quoted: m},
        );
      }

      let body = `📖 *KAMUS BESAR BAHASA INDONESIA*\n\n` + 
                 `🔎 *Kata:* ${query.toUpperCase()}\n` +
                 `────────────────────\n\n`;

      if (Array.isArray(result)) {
        result.forEach((def, i) => {
          const arti = def.arti || def.definisi || def;
          body += `${i + 1}. ${arti}\n\n`;
        });
      } else if (typeof result === "string") {
        body += `📝 *Arti:*\n${result}\n\n`;
      }

      body += `────────────────────\n`;
      body += `_Sumber: Data Resmi KBBI_`;

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
