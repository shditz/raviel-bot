const os = require("os");
const config = require("../config");

module.exports = {
  name: "ping",
  description: "Memeriksa kecepatan respons (latency) dan status kesehatan sistem bot.",
  async execute(sock, m, args, { jid }) {
    const start = Date.now();
    const sent = await sock.sendMessage(jid, { text: "🏓 *MENGUKUR...*" }, { quoted: m });
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
        `🏓 *PONG! BOT STATUS*\n\n` +
        `⚡ *Respons:* ${latency}ms\n` +
        `⏱️ *Aktif:* ${hours}j ${minutes}m ${seconds}d\n` +
        `💾 *Memori:* ${ramUsed} MB / ${ramTotal} GB\n` +
        `📡 *Platform:* ${os.platform()}\n` +
        `────────────────────\n` +
        `_Sistem berjalan dengan optimal._`
    }, { quoted: m });
  }
};
