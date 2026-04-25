const DRACIN_API = "https://puruboy-api.vercel.app/api/ai/dracin";

module.exports = {
  name: "dracintts",
  aliases: ["dracin", "dtts"],
  description: "Mengonversi teks menjadi suara (TTS) dengan karakter suara khas Dracin.",
  async execute(sock, m, args, {jid}) {
    if (!args.length) {
      return await sock.sendMessage(
        jid,
        {
          text: `❌ *FORMAT SALAH*\n\nGunakan: *!dracin <teks>*\n\n💡 *Opsi Tambahan:*\n• \`--music true/false\`\n• \`--speed 0.5-2.0\`\n• \`--volume 0.1-1.0\`\n\n*Contoh:* !dracin --music false --speed 1.5 Halo apa kabar?`,
        },
        {quoted: m},
      );
    }

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
        {text: "❌ *MASUKKAN TEKS*\n\nSilakan masukkan teks yang ingin Anda ubah menjadi pesan suara!"},
        {quoted: m},
      );
    }

    await sock.sendMessage(jid, {text: "🎙️ *MEMBUAT SUARA...*\n\nSedang mengonversi teks Anda menjadi audio berkualitas dengan suara Dracin AI."}, {quoted: m});

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
        throw new Error(`Koneksi API Gagal (${response.status})`);
      }

      const data = await response.json();

      if (!data.success || !data.result?.audio) {
        return await sock.sendMessage(jid, {text: "❌ *GAGAL*\n\nMaaf, sistem gagal membuat audio dari Dracin AI saat ini."}, {quoted: m});
      }

      await sock.sendMessage(
        jid,
        {
          audio: {url: data.result.audio},
          mimetype: "audio/mpeg",
          fileName: `dracintts-${Date.now()}.mp3`,
        },
        {quoted: m},
      );

      await sock.sendMessage(jid, {
          text: `✅ *KONVERSI BERHASIL*\n\n📝 *Teks:* \n_${data.result.text}_`
      }, {quoted: m});
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi server audio AI. Silakan coba kembali nanti."}, {quoted: m});
    }
  },
};
