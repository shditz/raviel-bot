const { sendMenuWithImage } = require("../handlers/menu");

module.exports = {
  name: "menu",
  aliases: ["help"],
  description: "Menampilkan menu / info perintah.",
  async execute(sock, m, args, context) {
    const { jid, sender, PREFIX, commands } = context;
    const commandInfo = args[0]?.toLowerCase();
    
    if (!commandInfo) {
      await sendMenuWithImage(sock, jid, sender);
      return;
    }

    const cmd = commands.get(commandInfo) || commands.get(Array.from(commands.values()).find(c => c.aliases?.includes(commandInfo))?.name);
    
    if (cmd) {
      await sock.sendMessage(jid, { text: `ℹ️ *Info Perintah ${PREFIX}${cmd.name}*\n\n${cmd.description || "Tidak ada deskripsi."}` }, { quoted: m });
    } else {
      await sock.sendMessage(jid, { text: `❌ Perintah *${commandInfo}* tidak ditemukan.` }, { quoted: m });
    }
  }
};
