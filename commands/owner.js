const config = require("../config");

module.exports = {
  name: "owner",
  description: "Menampilkan informasi kontak resmi pemilik dan pengembang bot ini.",
  async execute(sock, m, args, { jid }) {
    const body =
      `╭━━━━━━━━━ 👑 *OWNER INFO* ━━━━━━━━━╮\n` +
      `┃\n` +
      `┃ 📛 *Nama:* ${config.ownerName}\n` +
      `┃ 📱 *WhatsApp:* +${config.ownerNumber}\n` +
      `┃ 🤖 *Project:* ${config.botName}\n` +
      `┃\n` +
      `┃ 🌐 *Status:* Online & Active\n` +
      `┃\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

    await sock.sendMessage(jid, {
      image: config.ownerImage,
      caption: body
    }, { quoted: m });
  }
};
