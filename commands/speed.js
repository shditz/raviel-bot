const os = require("os");
const config = require("../config");

module.exports = {
  name: "speed",
  description: "Melihat kecepatan respon server bot.",
  async execute(sock, m, args, { jid }) {
    const start = Date.now();
    await sock.sendMessage(jid, { text: "Menghitung kecepatan..." }, { quoted: m });
    const end = Date.now();
    const cpus = os.cpus();
    const cpuModel = cpus[0] ? cpus[0].model : "Unknown";
    
    await sock.sendMessage(jid, {
      image: config.speedImage,
      caption: 
        `🚀 *Kecepatan Server*\n\n` +
        `⚡ Latency: *${end - start} ms*\n` +
        `💻 CPU: *${cpuModel}*\n` +
        `🧠 Core: *${cpus.length} Cores*`
    }, { quoted: m });
  }
};
