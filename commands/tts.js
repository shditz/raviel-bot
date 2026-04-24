const googleTTS = require("google-tts-api");

module.exports = {
  name: "tts",
  description: "Mengubah teks menjadi suara (Voice Note). Gunakan: !tts <kode_bahasa> <teks>",
  async execute(sock, m, args, { jid }) {
    let targetLang = "id"; // Default bahasa Indonesia
    let textToSpeak = "";

    const quotedMsg = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text;

    const isLangCode = (code) => /^[a-z]{2,3}(-[a-z]{2})?$/.test(code);

    if (quotedText) {
      targetLang = isLangCode(args[0]) ? args[0] : "id";
      textToSpeak = quotedText;
    } else {
      if (args.length < 1) {
        return await sock.sendMessage(jid, { text: "❌ Format salah. Gunakan: !tts <kode_bahasa> <teks> (contoh: !tts id halo semua)\natau balas teks dengan !tts" }, { quoted: m });
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
      return await sock.sendMessage(jid, { text: "❌ Masukkan teks yang ingin diubah menjadi suara!" }, { quoted: m });
    }

    if (textToSpeak.length > 200) {
      return await sock.sendMessage(jid, { text: "❌ Teks terlalu panjang! Maksimal 200 karakter." }, { quoted: m });
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
        ptt: true // Kirim sebagai Voice Note
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Gagal membuat suara. Pastikan kode bahasa benar (cth: id, en)." }, { quoted: m });
    }
  }
};
