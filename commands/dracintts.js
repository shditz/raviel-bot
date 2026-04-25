const DRACIN_API = "https://puruboy-api.vercel.app/api/ai/dracin";

module.exports = {
  name: "dracintts",
  aliases: ["dracin", "dtts"],
  description:
    "TTS dengan Dracin. Gunakan: !dracintts <text> atau !dracintts --music false --speed 1.5 <text>",
  async execute(sock, m, args, {jid}) {
    if (!args.length) {
      return await sock.sendMessage(
        jid,
        {
          text: "❌ Gunakan: !dracintts <text>\n\nOpsi tambahan:\n--music true/false (default: true)\n--speed 0.5-2.0 (default: 1.0)\n--volume 0.1-1.0 (default: 0.3)\n\nContoh: !dracintts --music false --speed 1.5 Halo apa kabar?",
        },
        {quoted: m},
      );
    }

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
        {text: "❌ Masukkan teks yang ingin diubah menjadi suara!"},
        {quoted: m},
      );
    }

    await sock.sendMessage(jid, {text: "🎙️ Membuat suara..."}, {quoted: m});

    try {
      const response = await fetch(DRACIN_API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          text: text,
          music: music,
          speed: speed,
          volume: volume,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.result?.audio) {
        return await sock.sendMessage(jid, {text: "❌ Gagal membuat TTS dari Dracin"}, {quoted: m});
      }

      // Send audio
      await sock.sendMessage(
        jid,
        {
          audio: {url: data.result.audio},
          mimetype: "audio/mpeg",
          fileName: `dracintts-${Date.now()}.mp3`,
        },
        {quoted: m},
      );

      // Send text info
      await sock.sendMessage(jid, {text: `✅ Teks: ${data.result.text}`}, {quoted: m});
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ Terjadi kesalahan. Coba lagi nanti!"}, {quoted: m});
    }
  },
};
