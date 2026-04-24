const { evaluate } = require("mathjs");

module.exports = {
  name: "kalkulator",
  aliases: ["calc", "hitung"],
  description: "Melakukan perhitungan matematika.",
  async execute(sock, m, args, { jid }) {
    const query = args.join(" ");
    if (!query) {
      return await sock.sendMessage(jid, { text: "❌ Masukkan angka! Contoh: !kalkulator 10 + 5 * 2" }, { quoted: m });
    }

    try {
      const result = evaluate(query);
      await sock.sendMessage(jid, { text: `🔢 *Hasil:* \n\n${query} = *${result}*` }, { quoted: m });
    } catch (err) {
      await sock.sendMessage(jid, { text: "❌ Format matematika tidak valid. Contoh yang benar: 10 + 5, 2^3, sqrt(16)" }, { quoted: m });
    }
  }
};
