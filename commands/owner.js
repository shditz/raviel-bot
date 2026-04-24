const config = require("../config");

module.exports = {
  name: "owner",
  description: "Menampilkan informasi tentang pembuat bot.",
  async execute(sock, m, args, { jid }) {
    const body =
      `╭━━━━ 👑 *Owner* ━━━━╮\n` +
      `┃\n` +
      `┃ 📛 Nama   : *${config.ownerName}*\n` +
      `┃ 📱 Nomor  : *+${config.ownerNumber}*\n` +
      `┃ 🤖 Bot    : *${config.botName}*\n` +
      `┃\n` +
      `╰━━━━━━━━━━━━━━━━━━━╯`;

    await sock.sendMessage(jid, {
      image: config.ownerImage,
      caption: body
    }, { quoted: m });
  }
};
