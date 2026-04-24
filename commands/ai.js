const OpenAI = require("openai");
require("dotenv").config();

let client = null;
if (process.env.OPENROUTER_KEY) {
  client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_KEY,
  });
}

module.exports = {
  name: "ai",
  aliases: ["chat", "gpt"],
  description: "Chat dengan AI pintar. Gunakan: !ai <pertanyaan>",
  async execute(sock, m, args, { jid }) {
    if (!client) {
      return await sock.sendMessage(jid, { text: "❌ Fitur AI belum dikonfigurasi (OPENROUTER_KEY kosong)." }, { quoted: m });
    }

    const prompt = args.join(" ");
    if (!prompt) {
      return await sock.sendMessage(jid, { text: "❌ Mau tanya apa? Contoh: !ai Siapa penemu lampu?" }, { quoted: m });
    }

    await sock.sendMessage(jid, { text: "🤖 Berpikir..." }, { quoted: m });

    try {
      const apiResponse = await client.chat.completions.create({
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const response = apiResponse.choices[0].message;
      let replyText = response.content;

      // Jika ada detail pemikiran (reasoning), kita bisa lampirkan atau abaikan.
      // Sesuai permintaan, fokus ke hasil utamanya.
      
      await sock.sendMessage(jid, { text: replyText }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ AI sedang pusing atau server penuh. Coba lagi nanti!" }, { quoted: m });
    }
  }
};
