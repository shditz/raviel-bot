const { evaluate } = require("mathjs");

module.exports = {
  name: "kalkulator",
  aliases: ["calc", "hitung"],
  description: "Asisten perhitungan matematika cepat untuk berbagai operasi aritmatika.",
  async execute(sock, m, args, { jid }) {
    const query = args.join(" ");
    if (!query) {
      return await sock.sendMessage(jid, { text: "❌ *MASUKKAN PERHITUNGAN*\n\nSilakan masukkan angka atau rumus yang ingin Anda hitung!\n*Contoh:* !kalkulator 10 + 5 * 2" }, { quoted: m });
    }

    try {
      const result = evaluate(query);
      await sock.sendMessage(jid, { 
          text: `🔢 *HASIL PERHITUNGAN*\n\n` +
                `📝 *Rumus:* ${query}\n` +
                `✅ *Hasil:* *${result}*\n\n` +
                `────────────────────\n` +
                `_Gunakan format standar matematika._` 
      }, { quoted: m });
    } catch (err) {
      await sock.sendMessage(jid, { text: "❌ *FORMAT TIDAK VALID*\n\nFormat matematika tidak didukung. Silakan gunakan simbol standar seperti (+, -, *, /, ^).\n*Contoh:* 2^3, sqrt(16), 10 * (5+2)" }, { quoted: m });
    }
  }
};
