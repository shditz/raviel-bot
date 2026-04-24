const os = require("os");
const config = require("../config");

module.exports = {
  name: "ping",
  description: "Cek kecepatan respon dan status bot.",
  async execute(sock, m, args, { jid }) {
    const start = Date.now();
    const sent = await sock.sendMessage(jid, { text: "🏓 Mengukur..." }, { quoted: m });
    const latency = Date.now() - start;
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const ramUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const ramTotal = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);

    await sock.sendMessage(jid, {
      image: config.pingImage,
      caption:
        `🏓 *Pong!*\n\n` +
        `⚡ Latency  : *${latency}ms*\n` +
        `⏱️ Uptime   : *${hours}h ${minutes}m ${seconds}s*\n` +
        `💾 RAM      : *${ramUsed} MB / ${ramTotal} GB*\n` +
        `📡 Platform : *${os.platform()}*`
    }, { quoted: m });
  }
};
