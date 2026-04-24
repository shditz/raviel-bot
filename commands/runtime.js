const config = require("../config");

module.exports = {
  name: "runtime",
  description: "Menampilkan waktu aktif bot.",
  async execute(sock, m, args, { jid }) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const timeString = `${days} Hari, ${hours} Jam, ${minutes} Menit, ${seconds} Detik`;
    await sock.sendMessage(jid, { 
      image: config.runtimeImage,
      caption: `⏳ *Bot Aktif Selama:*\n${timeString}` 
    }, { quoted: m });
  }
};
