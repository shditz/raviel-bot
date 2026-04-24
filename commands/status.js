const os = require("os");
const config = require("../config");

module.exports = {
  name: "status",
  description: "Melihat status keseluruhan sistem bot.",
  async execute(sock, m, args, { jid, commands, getTotalUsers, getTotalGroups }) {
    const memUsage = process.memoryUsage();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();

    await sock.sendMessage(jid, {
      image: config.statusImage,
      caption: 
        `📊 *Status Sistem*\n\n` +
        `🛠️ Total Command : *${commands.size}*\n` +
        `👥 Total Pengguna: *${getTotalUsers()} User*\n` +
        `🌐 Total Grup    : *${getTotalGroups()} Grup*\n` +
        `💾 RAM Digunakan : *${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB*\n` +
        `🧠 Total RAM     : *${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB*\n` +
        `📂 Sisa RAM      : *${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB*\n` +
        `🖥️ OS Platform   : *${os.platform()}*\n` +
        `Node.js Version  : *${process.version}*`
    }, { quoted: m });
  }
};
