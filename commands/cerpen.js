const GEMINI_API = "https://puruboy-api.vercel.app/api/ai/gemini-v2";

module.exports = {
  name: "cerpen",
  description: "Membuat cerita pendek berdasarkan tema, judul, dan deskripsi.",
  async execute(sock, m, args, {jid}) {
    const input = args.join(" ");
    if (!input) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *MASUKKAN TEMA*\n\nSilakan masukkan tema cerpen yang ingin dibuat!\n\n💡 *Format:* !cerpen Tema | Judul | Deskripsi\n*Contoh:* !cerpen Persahabatan | Petualangan di Hutan | Dua sahabat yang tersesat"},
        {quoted: m},
      );
    }

    const [tema, judul, deskripsi] = input.split("|").map(item => item.trim());

    if (!tema) {
      return await sock.sendMessage(jid, {text: "❌ *TEMA WAJIB ADA*\n\nHarap masukkan tema cerpen minimal di bagian awal."}, {quoted: m});
    }

    try {
      await sock.sendMessage(jid, {text: "✍️ *MENULIS CERPEN...*\n\nSedang merangkai cerita pendek terbaik untuk Anda, mohon tunggu sebentar."}, {quoted: m});

      const prompt = `Buatlah sebuah cerpen dengan tema "${tema}".${judul ? ` Judulnya adalah "${judul}".` : ""}${deskripsi ? ` Alur ceritanya tentang: ${deskripsi}.` : ""}
Buatlah cerpen yang menarik, emosional, dan memiliki pesan moral. Jangan sebutkan kamu adalah AI. Langsung berikan hasilnya. Format output:
📝 *CERPEN*
📌 *Tema:* ${tema}
📖 *Judul:* [Berikan judul yang sesuai jika tidak ada]
────────────────────
[Isi Cerpen]
────────────────────`;

      const response = await fetch(GEMINI_API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({prompt: prompt}),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        throw new Error(`Koneksi API Gagal (${response.status})`);
      }

      const data = await response.json();

      if (!data.success || !data.result?.answer) {
        return await sock.sendMessage(jid, {text: "❌ *GAGAL*\n\nMaaf, gagal membuat cerpen saat ini. Silakan coba lagi."}, {quoted: m});
      }

      await sock.sendMessage(jid, {text: data.result.answer}, {quoted: m});
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi AI. Silakan coba kembali nanti."}, {quoted: m});
    }
  },
};
