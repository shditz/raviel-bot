const { getUserRPG } = require("../database/rpg_db");
const { getAllActiveCooldowns, formatCooldown } = require("../utils/rpg_advanced");

module.exports = {
  name: "cd",
  aliases: ["cooldown", "cooldowns"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);
    const active = getAllActiveCooldowns(userRPG);

    if (active.length === 0) {
      return sock.sendMessage(jid, { text: `✅ Semua fitur siap digunakan! Tidak ada cooldown aktif.` }, { quoted: m });
    }

    let text = `⏳ *COOLDOWN AKTIF* ⏳\n────────────────────\n`;
    active.sort((a, b) => a.timeLeft - b.timeLeft);
    active.forEach(cd => {
      text += `${cd.label}: *${cd.formatted}*\n`;
    });
    text += `────────────────────\n_Total: ${active.length} cooldown aktif_`;

    return sock.sendMessage(jid, { text }, { quoted: m });
  }
};
