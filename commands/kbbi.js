module.exports = {
  name: "kbbi",
  description: "Mencari definisi kata di KBBI. Gunakan: !kbbi <kata>",
  async execute(sock, m, args, { jid }) {
    const query = args.join(" ").toLowerCase().trim();
    if (!query) {
      return await sock.sendMessage(jid, { text: "❌ Masukkan kata yang ingin dicari! Contoh: !kbbi rumah" }, { quoted: m });
    }

    try {
      // Gunakan API KBBI publik yang stabil
      const res = await fetch(`https://api.lolhuman.xyz/api/kbbi?apikey=GatauDeh&query=${encodeURIComponent(query)}`);

      let result = null;

      if (res.ok) {
        const data = await res.json();
        if (data.status === 200 && data.result) {
          result = data.result;
        }
      }

      // Fallback: coba endpoint alternatif
      if (!result) {
        const res2 = await fetch(`https://kbbi-api-zhirrr.vercel.app/api/kbbi?text=${encodeURIComponent(query)}`);
        if (res2.ok) {
          const contentType = res2.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const data2 = await res2.json();
            if (data2 && data2.result && data2.result !== "Tidak ditemukan") {
              result = data2.result;
            }
          }
        }
      }

      if (!result) {
        return await sock.sendMessage(jid, { text: `❌ Kata *${query}* tidak ditemukan dalam KBBI.` }, { quoted: m });
      }

      // Format output
      let body = `📖 *KBBI - Kamus Besar Bahasa Indonesia*\n\n` +
                 `🔎 *Kata:* ${query}\n\n`;

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

      await sock.sendMessage(jid, { text: body }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Terjadi kesalahan saat mengambil data KBBI." }, { quoted: m });
    }
  }
};
