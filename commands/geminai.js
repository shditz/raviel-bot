require("dotenv").config();
const {LRUCache} = require("../utils/cache");

const GEMINI_API = "https://puruboy-api.vercel.app/api/ai/gemini-v2";
const DRACIN_API = "https://puruboy-api.vercel.app/api/ai/dracin";

// Simple cache for Gemini responses (10 minutes TTL)
const geminiCache = new LRUCache(100, 600000);

module.exports = {
  name: "geminiai",
  aliases: ["gemini", "geminai"],
  description:
    "Chat dengan Gemini AI atau gunakan TTS. Gunakan: !geminiai <pertanyaan> atau !geminiai --tts <teks>",
  async execute(sock, m, args, {jid}) {
    const commandStr = args.join(" ");

    // Cek apakah menggunakan TTS
    if (commandStr.startsWith("--tts")) {
      return await handleDracinTTS(sock, m, args, jid);
    }

    // Chat dengan Gemini
    return await handleGeminiChat(sock, m, args, jid);
  },
};

async function handleGeminiChat(sock, m, args, jid) {
  const prompt = args.join(" ");

  if (!prompt) {
    return await sock.sendMessage(
      jid,
      {text: "❌ Mau tanya apa? Contoh: !geminiai Siapa penemu lampu?"},
      {quoted: m},
    );
  }

  try {
    // OPTIMIZATION: Check cache first
    const cacheKey = `gemini:${prompt.toLowerCase()}`;
    const cachedResult = geminiCache.get(cacheKey);
    if (cachedResult) {
      await sock.sendMessage(jid, {text: cachedResult}, {quoted: m});
      return;
    }

    await sock.sendMessage(jid, {text: "🤖 Berpikir..."}, {quoted: m});

    const response = await fetch(GEMINI_API, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({prompt: prompt}),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      return await sock.sendMessage(
        jid,
        {text: "❌ Gagal mendapatkan respons dari Gemini"},
        {quoted: m},
      );
    }

    const answer = data.result?.answer || "Tidak ada respons dari AI";

    // OPTIMIZATION: Cache the result
    geminiCache.set(cacheKey, answer);

    await sock.sendMessage(jid, {text: answer}, {quoted: m});
  } catch (err) {
    console.error(err);
    await sock.sendMessage(jid, {text: "❌ Terjadi kesalahan. Coba lagi nanti!"}, {quoted: m});
  }
}

async function handleDracinTTS(sock, m, args, jid) {
  // Remove --tts from args
  args.shift();

  // Parse parameters
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
        text: `❌ Format salah!

Gunakan: !geminiai --tts <teks> [--music true/false] [--speed 0.5-2.0] [--volume 0.1-1.0]

Contoh:
!geminiai --tts Halo, apa kabar?
!geminiai --tts Halo semua --music false --speed 1.5 --volume 0.5`,
      },
      {quoted: m},
    );
  }

  await sock.sendMessage(jid, {text: "🎙️ Membuat suara..."}, {quoted: m});

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
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.result?.audio) {
      return await sock.sendMessage(jid, {text: "❌ Gagal membuat audio dari Dracin"}, {quoted: m});
    }

    const audioUrl = data.result.audio;

    // Kirim audio
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
    await sock.sendMessage(jid, {text: "❌ Terjadi kesalahan. Coba lagi nanti!"}, {quoted: m});
  }
}
