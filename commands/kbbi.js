const {LRUCache} = require("../utils/cache");

// Simple cache for KBBI results (5 minutes TTL)
const kbbiCache = new LRUCache(100, 300000);

module.exports = {
  name: "kbbi",
  description: "Mencari definisi kata di KBBI. Gunakan: !kbbi <kata>",
  async execute(sock, m, args, {jid}) {
    const query = args.join(" ").toLowerCase().trim();
    if (!query) {
      return await sock.sendMessage(
        jid,
        {text: "❌ Masukkan kata yang ingin dicari! Contoh: !kbbi rumah"},
        {quoted: m},
      );
    }

    try {
      // OPTIMIZATION: Check cache first
      const cacheKey = `kbbi:${query}`;
      const cachedResult = kbbiCache.get(cacheKey);
      if (cachedResult) {
        return await sock.sendMessage(jid, {text: cachedResult}, {quoted: m});
      }

      // OPTIMIZATION: Use Promise.race() to fetch from fastest API (parallel, not sequential!)
      const api1 = fetch(
        `https://api.lolhuman.xyz/api/kbbi?apikey=GatauDeh&query=${encodeURIComponent(query)}`,
        {
          signal: AbortSignal.timeout(5000), // 5 second timeout
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

      // Race both APIs - whoever responds first wins!
      const data = await Promise.race([api1, api2]).catch(() => {
        // Both failed, try them sequentially as last resort
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
          {text: `❌ Kata *${query}* tidak ditemukan dalam KBBI.`},
          {quoted: m},
        );
      }

      // Format output
      let body = `📖 *KBBI - Kamus Besar Bahasa Indonesia*\n\n` + `🔎 *Kata:* ${query}\n\n`;

      if (Array.isArray(result)) {
        result.forEach((def, i) => {
          const arti = def.arti || def.definisi || def;
          body += `${i + 1}. ${arti}\n`;
        });
      } else if (typeof result === "string") {
        body += `📝 *Arti:*\n${result}`;
      } else if (typeof result === "object") {
        body += `📝 *Arti:*\n${JSON.stringify(result, null, 2)}`;
      }

      // OPTIMIZATION: Cache the result
      kbbiCache.set(cacheKey, body);

      await sock.sendMessage(jid, {text: body}, {quoted: m});
    } catch (err) {
      console.error(err);
      await sock.sendMessage(
        jid,
        {text: "❌ Terjadi kesalahan saat mengambil data KBBI."},
        {quoted: m},
      );
    }
  },
};
