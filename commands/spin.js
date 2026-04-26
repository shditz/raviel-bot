module.exports = {
  name: "spin",
  aliases: ["acak", "random"],
  description: "Memilih sesuatu secara acak dari daftar yang Anda berikan.",
  async execute(sock, m, args, {jid}) {
    const input = args.join(" ");
    if (!input) {
      return await sock.sendMessage(
        jid,
        {text: "❌ *MASUKKAN DAFTAR*\n\nSilakan masukkan daftar pilihan yang ingin di-spin, pisahkan dengan koma!\n\n*Contoh:* !spin Budi, Andi, Caca\n*Contoh:* !spin Nasi Goreng, Mie Ayam, Bakso"},
        {quoted: m},
      );
    }

    const items = input.split(",").map(item => item.trim()).filter(item => item.length > 0);

    if (items.length < 2) {
      return await sock.sendMessage(jid, {text: "❌ *MINIMAL 2 PILIHAN*\n\nHarap masukkan minimal 2 pilihan agar bisa di-acak!"}, {quoted: m});
    }

    try {
      const { key } = await sock.sendMessage(jid, {text: "🎡 *MENUNGGU SPIN...*"}, {quoted: m});

      // Simulating "spinning" effect with a small delay
      const frames = ["🔄", "🔃", "🔁", "🌀", "🎡"];
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await sock.sendMessage(jid, {
          text: `${frames[i % frames.length]} *SEDANG MENGE-SPIN...*\n\n_Mencoba memilih dari ${items.length} pilihan..._`,
          edit: key
        });
      }

      const winner = items[Math.floor(Math.random() * items.length)];

      await new Promise(resolve => setTimeout(resolve, 500));
      await sock.sendMessage(jid, {
        text: `🎉 *HASIL SPIN* 🎉\n\n────────────────────\n💎 *Pemenang:* ${winner.toUpperCase()}\n────────────────────\n\n_Daftar pilihan: ${items.join(", ")}_`,
        edit: key
      });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, {text: "❌ *KESALAHAN SISTEM*\n\nTerjadi kendala saat melakukan spin. Silakan coba kembali nanti."}, {quoted: m});
    }
  },
};
