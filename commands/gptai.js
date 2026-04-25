const {LRUCache} = require("../utils/cache");

const GPTAI_API = "https://puruboy-api.vercel.app/api/ai/notegpt";

const gptCache = new LRUCache(100, 600000);

module.exports = {
  name: "gptai",
  aliases: ["gpt"],
  description: "Asisten cerdas GPT AI untuk menjawab berbagai pertanyaan Anda secara mendalam.",
  async execute(sock, m, args, {jid}) {
    const prompt = args.join(" ");

    if (!prompt) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *BUTUH PERTANYAAN*\n\nSilakan masukkan pertanyaan atau perintah yang ingin Anda ajukan kepada GPT AI.\n*Contoh:* !gpt Buatkan saya puisi pendek."},
        {quoted: m},
      );
    }

    try {
      const cacheKey = `gpt:${prompt.toLowerCase()}`;
      const cachedResult = gptCache.get(cacheKey);
      if (cachedResult) {
        return await sock.sendMessage(jid, {text: cachedResult}, {quoted: m});
      }

      await sock.sendMessage(jid, {text: "🤖 *MENGANALISIS...*\n\nGPT sedang memikirkan jawaban terbaik untuk Anda, mohon tunggu sebentar."}, {quoted: m});

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
        throw new Error(`Koneksi API Gagal (${response.status})`);
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
            } catch (e) {}
          }
        }
      }

      if (!fullText) {
        return await sock.sendMessage(
          jid,
          {text: "❌ *GAGAL*\n\nMaaf, sistem gagal mendapatkan respons dari GPT AI saat ini."},
          {quoted: m},
        );
      }

      if (fullText.length > 2000) {
        const chunks = fullText.match(/[\s\S]{1,2000}/g) || [];
        for (const chunk of chunks) {
          await sock.sendMessage(jid, {text: chunk}, {quoted: m});
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } else {
        await sock.sendMessage(jid, {text: fullText}, {quoted: m});
      }

      gptCache.set(cacheKey, fullText);
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi server AI. Silakan coba kembali nanti."}, {quoted: m});
    }
  },
};
