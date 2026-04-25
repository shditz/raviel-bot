const DEEPSEEKAI_API = "https://puruboy-api.vercel.app/api/ai/notegpt";

module.exports = {
  name: "deepseekai",
  aliases: ["deepseek"],
  description: "Chat asisten AI tingkat lanjut menggunakan model DeepSeek R1 untuk penalaran yang lebih kuat.",
  async execute(sock, m, args, {jid}) {
    const prompt = args.join(" ");

    if (!prompt) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *BUTUH PERTANYAAN*\n\nSilakan masukkan pertanyaan atau instruksi yang ingin Anda ajukan kepada DeepSeek AI.\n*Contoh:* !deepseek Jelaskan cara kerja quantum computing."},
        {quoted: m},
      );
    }

    await sock.sendMessage(jid, {text: "🤖 *MENGANALISIS...*\n\nDeepSeek AI sedang memproses jawaban dengan penalaran mendalam, mohon tunggu sebentar."}, {quoted: m});

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
          {text: "❌ *GAGAL*\n\nMaaf, sistem gagal mendapatkan respons dari DeepSeek AI saat ini."},
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
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi server AI. Silakan coba kembali nanti."}, {quoted: m});
    }
  },
};
