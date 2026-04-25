const os = require("os");
const config = require("../config");

module.exports = {
  name: "speed",
  description: "Mengukur performa dan spesifikasi infrastruktur server yang menjalankan bot.",
  async execute(sock, m, args, { jid }) {
    const start = Date.now();
    await sock.sendMessage(jid, { text: "🚀 *MENGHITUNG KECEPATAN...*" }, { quoted: m });
    const end = Date.now();
    
    const cpus = os.cpus();
    const cpuModel = cpus[0] ? cpus[0].model : "Unknown";
    
    await sock.sendMessage(jid, {
      image: config.speedImage,
      caption: 
        `🚀 *SERVER PERFORMANCE*\n\n` +
        `⚡ *Respons:* ${end - start} ms\n` +
        `💻 *CPU:* ${cpuModel}\n` +
        `🧠 *Inti:* ${cpus.length} Cores\n` +
        `────────────────────\n` +
        `_Infrastruktur server berjalan stabil._`
    }, { quoted: m });
  }
};
