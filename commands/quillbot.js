const QUILLBOT_API = "https://puruboy-api.vercel.app/api/ai/quillbot";

module.exports = {
  name: "quillbot",
  aliases: ["quill"],
  description: "Chat asisten AI pintar menggunakan mesin Quillbot untuk membantu tugas dan diskusi.",
  async execute(sock, m, args, {jid}) {
    const message = args.join(" ");

    if (!message) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *BUTUH PERTANYAAN*\n\nSilakan masukkan pertanyaan atau teks yang ingin Anda diskusikan dengan Quillbot AI.\n*Contoh:* !quillbot Jelaskan teori relativitas."},
        {quoted: m},
      );
    }

    await sock.sendMessage(jid, {text: "🤖 *MENGANALISIS...*\n\nQuillbot AI sedang merumuskan jawaban terbaik untuk Anda, mohon tunggu sebentar."}, {quoted: m});

    try {
      const response = await fetch(QUILLBOT_API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({message: message}),
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
                if (data.content) {
                  fullText += data.content;
                }
              }
            } catch (e) {}
          }
        }
      }

      if (!fullText) {
        return await sock.sendMessage(
          jid,
          {text: "❌ *GAGAL*\n\nMaaf, sistem gagal mendapatkan respons dari Quillbot AI saat ini."},
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
