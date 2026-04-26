const { sendMenuWithImage } = require("../handlers/menu");

module.exports = {
  name: "menu",
  aliases: ["help"],
  description: "Menampilkan daftar seluruh perintah yang tersedia atau informasi detail mengenai satu perintah.",
  async execute(sock, m, args, context) {
    const { jid, sender, PREFIX, commands } = context;
    const commandInfo = args[0]?.toLowerCase();
    
    if (!commandInfo) {
      await sendMenuWithImage(sock, jid, sender, m);
      return;
    }

    const cmd = commands.get(commandInfo) || commands.get(Array.from(commands.values()).find(c => c.aliases?.includes(commandInfo))?.name);
    
    if (cmd) {
      await sock.sendMessage(jid, { 
          text: `ℹ️ *INFORMASI PERINTAH*\n\n` +
                `📌 *Nama:* ${PREFIX}${cmd.name}\n` +
                `📖 *Deskripsi:* \n${cmd.description || "Tidak ada deskripsi tersedia."}\n\n` +
                `────────────────────\n` +
                `_Gunakan bot dengan bijak sesuai fungsinya._` 
      }, { quoted: m });
    } else {
      await sock.sendMessage(jid, { text: `❌ *TIDAK DITEMUKAN*\n\nPerintah *${commandInfo}* tidak terdaftar dalam sistem kami.` }, { quoted: m });
    }
  }
};
