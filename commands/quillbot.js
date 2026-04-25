const QUILLBOT_API = "https://puruboy-api.vercel.app/api/ai/quillbot";

module.exports = {
  name: "quillbot",
  aliases: ["quill"],
  description: "Chat dengan Quillbot AI. Gunakan: !quillbot <pertanyaan>",
  async execute(sock, m, args, {jid}) {
    const message = args.join(" ");

    if (!message) {
      return await sock.sendMessage(
        jid,
        {text: "❌ Mau tanya apa? Contoh: !quillbot Apa itu pemrograman fungsional?"},
        {quoted: m},
      );
    }

    await sock.sendMessage(jid, {text: "🤖 Berpikir..."}, {quoted: m});

    try {
      const response = await fetch(QUILLBOT_API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({message: message}),
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
                if (data.content) {
                  fullText += data.content;
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
          {text: "❌ Gagal mendapatkan respons dari Quillbot AI"},
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
