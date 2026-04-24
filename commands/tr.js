const { translate } = require("@vitalets/google-translate-api");

module.exports = {
  name: "tr",
  aliases: ["translate"],
  description: "Menerjemahkan teks. Gunakan: !tr <kode_bahasa> <teks> atau balas teks.",
  async execute(sock, m, args, { jid }) {
    let targetLang = "id"; // Default bahasa Indonesia
    let textToTranslate = "";

    const quotedMsg = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text;

    if (quotedText) {
      // Jika mereply, anggap argumen pertama sebagai kode bahasa (jika ada)
      targetLang = args[0] || "id";
      textToTranslate = quotedText;
    } else {
      if (args.length < 2) {
        return await sock.sendMessage(jid, { text: "❌ Format salah. Gunakan: !tr <kode_bahasa> <teks> (contoh: !tr en halo dunia)\natau balas sebuah pesan teks dengan !tr <kode_bahasa>" }, { quoted: m });
      }
      targetLang = args[0];
      textToTranslate = args.slice(1).join(" ");
    }

    try {
      // google-translate-api usage
      const { text, raw } = await translate(textToTranslate, { to: targetLang });
      
      const sourceLang = raw?.src || "auto";

      await sock.sendMessage(jid, {
        text: `🌐 *Translate* (${sourceLang} ➔ ${targetLang})\n\n${text}`
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal menerjemahkan teks. Pastikan kode bahasa benar (cth: id, en, ja)." }, { quoted: m });
    }
  }
};
