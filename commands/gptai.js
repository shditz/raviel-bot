const {LRUCache} = require("../utils/cache");

const GPTAI_API = "https://puruboy-api.vercel.app/api/ai/notegpt";

// Simple cache for GPT responses (10 minutes TTL)
const gptCache = new LRUCache(100, 600000);

module.exports = {
  name: "gptai",
  aliases: ["gpt"],
  description: "Chat dengan GPT AI. Gunakan: !gptai <pertanyaan>",
  async execute(sock, m, args, {jid}) {
    const prompt = args.join(" ");

    if (!prompt) {
      return await sock.sendMessage(
        jid,
        {text: "❌ Mau tanya apa? Contoh: !gptai Siapa penemu lampu?"},
        {quoted: m},
      );
    }

    try {
      // OPTIMIZATION: Check cache first
      const cacheKey = `gpt:${prompt.toLowerCase()}`;
      const cachedResult = gptCache.get(cacheKey);
      if (cachedResult) {
        return await sock.sendMessage(jid, {text: cachedResult}, {quoted: m});
      }

      await sock.sendMessage(jid, {text: "🤖 Berpikir..."}, {quoted: m});

      const response = await fetch(GPTAI_API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          prompt: prompt,
          model: "gpt-5-mini",
          chat_mode: "standard",
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      let fullText = "";
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const {done, value} = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.replace("data: ", "").trim();
              if (jsonStr) {
                const data = JSON.parse(jsonStr);
                if (data.text) {
                  fullText += data.text;
                }
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      if (!fullText) {
        return await sock.sendMessage(
          jid,
          {text: "❌ Gagal mendapatkan respons dari GPT AI"},
          {quoted: m},
        );
      }

      // Send response in chunks if too long
      if (fullText.length > 2000) {
        const chunks = fullText.match(/[\s\S]{1,2000}/g) || [];
        for (const chunk of chunks) {
          await sock.sendMessage(jid, {text: chunk}, {quoted: m});
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } else {
        await sock.sendMessage(jid, {text: fullText}, {quoted: m});
      }

      // OPTIMIZATION: Cache the result
      gptCache.set(cacheKey, fullText);
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ Terjadi kesalahan. Coba lagi nanti!"}, {quoted: m});
    }
  },
};
