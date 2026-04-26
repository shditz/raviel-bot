const GEMINI_API = "https://puruboy-api.vercel.app/api/ai/gemini-v2";

module.exports = {
  name: "pantun",
  description: "Membuat beberapa bait pantun berdasarkan tema.",
  async execute(sock, m, args, {jid}) {
    const input = args.join(" ");
    if (!input) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *MASUKKAN TEMA*\n\nSilakan masukkan tema pantun yang ingin dibuat!\n\n💡 *Format:* !pantun Tema | Deskripsi\n*Contoh:* !pantun Nasihat | Tentang pentingnya belajar"},
        {quoted: m},
      );
    }

    const [tema, deskripsi] = input.split("|").map(item => item.trim());

    if (!tema) {
      return await sock.sendMessage(jid, {text: "❌ *TEMA WAJIB ADA*\n\nHarap masukkan tema pantun minimal di bagian awal."}, {quoted: m});
    }

    try {
      await sock.sendMessage(jid, {text: "🎑 *MENYUSUN PANTUN...*\n\nSedang menyusun sampiran dan isi pantun, mohon tunggu sebentar."}, {quoted: m});

      const prompt = `Buatlah beberapa bait pantun (minimal 2 bait) dengan tema "${tema}".${deskripsi ? ` Pantunnya tentang: ${deskripsi}.` : ""}
Pastikan rima (a-b-a-b) dan struktur pantun benar (2 baris sampiran, 2 baris isi). Jangan sebutkan kamu adalah AI. Langsung berikan hasilnya. Format output:
🎑 *PANTUN*
📌 *Tema:* ${tema}
────────────────────
[Isi Pantun]
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
        return await sock.sendMessage(jid, {text: "❌ *GAGAL*\n\nMaaf, gagal membuat pantun saat ini. Silakan coba lagi."}, {quoted: m});
      }

      await sock.sendMessage(jid, {text: data.result.answer}, {quoted: m});
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat menghubungi AI. Silakan coba kembali nanti."}, {quoted: m});
    }
  },
};
