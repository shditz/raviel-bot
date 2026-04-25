const googleTTS = require("google-tts-api");

module.exports = {
  name: "tts",
  description: "Mengubah teks tulisan menjadi suara (Voice Note).",
  async execute(sock, m, args, { jid }) {
    let targetLang = "id";
    let textToSpeak = "";

    const quotedMsg = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text;

    const isLangCode = (code) => /^[a-z]{2,3}(-[a-z]{2})?$/.test(code);

    if (quotedText) {
      targetLang = isLangCode(args[0]) ? args[0] : "id";
      textToSpeak = quotedText;
    } else {
      if (args.length < 1) {
        return await sock.sendMessage(jid, { 
            text: `❌ *FORMAT SALAH*\n\nGunakan format: *!tts <kode_bahasa> <teks>*\n*Contoh:* !tts id halo semua\n\n_Atau balas (reply) pesan teks dengan perintah *!tts*._` 
        }, { quoted: m });
      }
      
      if (isLangCode(args[0])) {
        targetLang = args[0];
        textToSpeak = args.slice(1).join(" ");
      } else {
        targetLang = "id";
        textToSpeak = args.join(" ");
      }
    }

    if (!textToSpeak) {
      return await sock.sendMessage(jid, { text: "❌ *MASUKKAN TEKS*\n\nSilakan tentukan teks yang ingin Anda ubah menjadi pesan suara!" }, { quoted: m });
    }

    if (textToSpeak.length > 200) {
      return await sock.sendMessage(jid, { text: "❌ *TEKS TERLALU PANJANG*\n\nBatas maksimal adalah 200 karakter demi menjaga stabilitas sistem." }, { quoted: m });
    }

    try {
      const url = googleTTS.getAudioUrl(textToSpeak, {
        lang: targetLang,
        slow: false,
        host: "https://translate.google.com",
      });

      await sock.sendMessage(jid, {
        audio: { url: url },
        mimetype: "audio/mp4",
        ptt: true
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ *GAGAL MEMPROSES*\n\nTerjadi kesalahan saat membuat suara. Pastikan kode bahasa yang Anda gunakan valid (contoh: id, en, ja)." }, { quoted: m });
    }
  }
};
