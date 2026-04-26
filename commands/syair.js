const GEMINI_API = "https://puruboy-api.vercel.app/api/ai/gemini-v2";

module.exports = {
  name: "syair",
  description: "Membuat beberapa bait syair berdasarkan tema.",
  async execute(sock, m, args, {jid}) {
    const input = args.join(" ");
    if (!input) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *MASUKKAN TEMA*\n\nSilakan masukkan tema syair yang ingin dibuat!\n\n💡 *Format:* !syair Tema | Deskripsi\n*Contoh:* !syair Kehidupan | Perjuangan mencapai cita-cita"},
        {quoted: m},
      );
    }

    const [tema, deskripsi] = input.split("|").map(item => item.trim());

    if (!tema) {
      return await sock.sendMessage(jid, {text: "❌ *TEMA WAJIB ADA*\n\nHarap masukkan tema syair minimal di bagian awal."}, {quoted: m});
    }

    try {
      await sock.sendMessage(jid, {text: "📜 *MENULIS SYAIR...*\n\nSedang menyusun bait-bait syair yang indah, mohon tunggu sebentar."}, {quoted: m});

      const prompt = `Buatlah beberapa bait syair (minimal 2 bait) dengan tema "${tema}".${deskripsi ? ` Syairnya tentang: ${deskripsi}.` : ""}
Gunakan rima yang tepat (a-a-a-a) sesuai kaidah syair. Jangan sebutkan kamu adalah AI. Langsung berikan hasilnya. Format output:
📜 *SYAIR*
📌 *Tema:* ${tema}
────────────────────
[Isi Syair]
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
        return await sock.sendMessage(jid, {text: "❌ *GAGAL*\n\nMaaf, gagal membuat syair saat ini. Silakan coba lagi."}, {quoted: m});
      }

      await sock.sendMessage(jid, {text: data.result.answer}, {quoted: m});
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi AI. Silakan coba kembali nanti."}, {quoted: m});
    }
  },
};
