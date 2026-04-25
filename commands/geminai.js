require("dotenv").config();
const {LRUCache} = require("../utils/cache");

const GEMINI_API = "https://puruboy-api.vercel.app/api/ai/gemini-v2";
const DRACIN_API = "https://puruboy-api.vercel.app/api/ai/dracin";

const geminiCache = new LRUCache(100, 600000);

module.exports = {
  name: "geminiai",
  aliases: ["gemini", "geminai"],
  description: "Asisten AI pintar untuk menjawab pertanyaan atau mengubah teks menjadi suara.",
  async execute(sock, m, args, {jid}) {
    const commandStr = args.join(" ");

    if (commandStr.startsWith("--tts")) {
      return await handleDracinTTS(sock, m, args, jid);
    }

    return await handleGeminiChat(sock, m, args, jid);
  },
};

async function handleGeminiChat(sock, m, args, jid) {
  const prompt = args.join(" ");

  if (!prompt) {
    return await sock.sendMessage(
      jid,
      {text: "❌ *BUTUH PERTANYAAN*\n\nSilakan masukkan pertanyaan yang ingin Anda tanyakan kepada Gemini AI.\n*Contoh:* !gemini Siapa penemu lampu?"},
      {quoted: m},
    );
  }

  try {
    const cacheKey = `gemini:${prompt.toLowerCase()}`;
    const cachedResult = geminiCache.get(cacheKey);
    if (cachedResult) {
      await sock.sendMessage(jid, {text: cachedResult}, {quoted: m});
      return;
    }

    await sock.sendMessage(jid, {text: "🤖 *MENGANALISIS...*\n\nGemini sedang memproses jawaban terbaik untuk Anda, mohon tunggu sebentar."}, {quoted: m});

    const response = await fetch(GEMINI_API, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({prompt: prompt}),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Koneksi API Gagal (${response.status})`);
    }

    const data = await response.json();

    if (!data.success) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *GAGAL*\n\nMaaf, sistem gagal mendapatkan respons dari Gemini AI saat ini."},
        {quoted: m},
      );
    }

    const answer = data.result?.answer || "Tidak ada respons dari AI.";
    geminiCache.set(cacheKey, answer);

    await sock.sendMessage(jid, {text: answer}, {quoted: m});
  } catch (err) {
    console.error(err);
    await sock.sendMessage(jid, {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi server AI. Silakan coba kembali nanti."}, {quoted: m});
  }
}

async function handleDracinTTS(sock, m, args, jid) {
  args.shift();

  let text = "";
  let music = true;
  let speed = 1.0;
  let volume = 0.3;

  let i = 0;
  while (i < args.length) {
    if (args[i] === "--music" && i + 1 < args.length) {
      music = args[i + 1].toLowerCase() === "true";
      i += 2;
    } else if (args[i] === "--speed" && i + 1 < args.length) {
      speed = parseFloat(args[i + 1]);
      if (isNaN(speed) || speed < 0.5 || speed > 2.0) speed = 1.0;
      i += 2;
    } else if (args[i] === "--volume" && i + 1 < args.length) {
      volume = parseFloat(args[i + 1]);
      if (isNaN(volume) || volume < 0.1 || volume > 1.0) volume = 0.3;
      i += 2;
    } else {
      text += (text ? " " : "") + args[i];
      i++;
    }
  }

  if (!text) {
    return await sock.sendMessage(
      jid,
      {
        text: `❌ *FORMAT TTS SALAH*\n\nGunakan: *!gemini --tts <teks>*\n\n💡 *Opsi Tambahan:*\n• \`--music true/false\`\n• \`--speed 0.5-2.0\`\n• \`--volume 0.1-1.0\``,
      },
      {quoted: m},
    );
  }

  await sock.sendMessage(jid, {text: "🎙️ *MENYIAPKAN SUARA...*\n\nSedang mengonversi teks menjadi audio dengan suara khas Dracin AI."}, {quoted: m});

  try {
    const payload = {
      text: text,
      music: music,
    };

    if (speed !== 1.0) payload.speed = speed;
    if (volume !== 0.3) payload.volume = volume;

    const response = await fetch(DRACIN_API, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Koneksi API Gagal (${response.status})`);
    }

    const data = await response.json();

    if (!data.success || !data.result?.audio) {
      return await sock.sendMessage(jid, {text: "❌ *GAGAL*\n\nMaaf, sistem gagal membuat audio dari Dracin AI saat ini."}, {quoted: m});
    }

    const audioUrl = data.result.audio;

    await sock.sendMessage(
      jid,
      {
        audio: {url: audioUrl},
        mimetype: "audio/mpeg",
        ptt: false,
      },
      {quoted: m},
    );
  } catch (err) {
    console.error(err);
    await sock.sendMessage(jid, {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi server audio AI. Silakan coba kembali nanti."}, {quoted: m});
  }
}
