const os = require("os");
const config = require("../config");

module.exports = {
  name: "status",
  description: "Menampilkan statistik lengkap mengenai penggunaan sumber daya dan data statistik bot.",
  async execute(sock, m, args, { jid, commands, getTotalUsers, getTotalGroups }) {
    const memUsage = process.memoryUsage();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();

    await sock.sendMessage(jid, {
      image: config.statusImage,
      caption: 
        `📊 *STATISTIK SISTEM KESELURUHAN*\n\n` +
        `🛠️ *Total Perintah:* ${commands.size}\n` +
        `👥 *Total Pengguna:* ${getTotalUsers()} User\n` +
        `🌐 *Total Grup:* ${getTotalGroups()} Grup\n` +
        `────────────────────\n` +
        `💾 *RAM Digunakan:* ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
        `🧠 *Total RAM:* ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
        `📂 *Sisa RAM:* ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
        `────────────────────\n` +
        `🖥️ *OS Platform:* ${os.platform()}\n` +
        `⚙️ *Node.js:* ${process.version}\n\n` +
        `_Sistem dalam kondisi prima dan siap melayani._`
    }, { quoted: m });
  }
};
