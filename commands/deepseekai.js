const DEEPSEEKAI_API = "https://puruboy-api.vercel.app/api/ai/notegpt";

module.exports = {
  name: "deepseekai",
  aliases: ["deepseek"],
  description: "Chat dengan DeepSeek AI. Gunakan: !deepseekai <pertanyaan>",
  async execute(sock, m, args, {jid}) {
    const prompt = args.join(" ");

    if (!prompt) {
      return await sock.sendMessage(
        jid,
        {text: "❌ Mau tanya apa? Contoh: !deepseekai Jelaskan cara kerja quantum computing"},
        {quoted: m},
      );
    }

    await sock.sendMessage(jid, {text: "🤖 Berpikir..."}, {quoted: m});

    try {
      const response = await fetch(DEEPSEEKAI_API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          prompt: prompt,
          model: "TA/deepseek-ai/DeepSeek-R1",
          chat_mode: "standard",
        }),
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
          {text: "❌ Gagal mendapatkan respons dari DeepSeek AI"},
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
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ Terjadi kesalahan. Coba lagi nanti!"}, {quoted: m});
    }
  },
};
