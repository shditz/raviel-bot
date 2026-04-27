const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { checkRegen } = require("../utils/rpg_core");

module.exports = {
  name: "mana",
  aliases: ["stamina", "rest", "buff"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    let userRPG = getUserRPG(sender, gUser.name);

    userRPG = checkRegen(userRPG);

    if (cmd === "mana" || cmd === "stamina") {
      const text = `🔋 *ENERGY STATUS* 🔋
────────────────────
❤️ *Stamina:* ${userRPG.stamina} / ${userRPG.maxStamina}
🔷 *Mana:* ${userRPG.mana} / ${userRPG.maxMana}
────────────────────
_Energi akan pulih 5 poin setiap menit._
_Gunakan ${PREFIX}rest untuk memulihkan dengan potion jika perlu._`;
      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    if (cmd === "rest") {
      // Consume potions to rest
      if (userRPG.inventory["health_potion"] > 0) {
        userRPG.inventory["health_potion"] -= 1;
        userRPG.stamina = Math.min(userRPG.maxStamina, userRPG.stamina + 50);
        userRPG.mana = Math.min(userRPG.maxMana, userRPG.mana + 50);
        updateUserRPG(sender, { inventory: userRPG.inventory, stamina: userRPG.stamina, mana: userRPG.mana });
        return sock.sendMessage(jid, { text: `🛏️ Kamu beristirahat dan meminum Potion!\nStamina dan Mana pulih 50 poin.` }, { quoted: m });
      } else {
        return sock.sendMessage(jid, { text: `⚠️ Kamu tidak memiliki Health Potion untuk beristirahat cepat! Tunggu regen otomatis.` }, { quoted: m });
      }
    }

    if (cmd === "buff") {
      const buffs = userRPG.buffs || [];
      if (buffs.length === 0) {
         return sock.sendMessage(jid, { text: `🛡️ *ACTIVE BUFFS*\nKamu tidak memiliki efek buff/debuff aktif.` }, { quoted: m });
      }

      const now = Date.now();
      let active = buffs.filter(b => b.expire > now);
      
      if (active.length === 0) {
         return sock.sendMessage(jid, { text: `🛡️ *ACTIVE BUFFS*\nSemua buff telah kadaluwarsa.` }, { quoted: m });
      }

      let text = `🛡️ *ACTIVE BUFFS* 🛡️\n────────────────────\n`;
      active.forEach(b => {
         const timeLeft = Math.floor((b.expire - now) / 60000);
         text += `- ${b.name} (${timeLeft} menit tersisa)\n`;
      });

      return sock.sendMessage(jid, { text }, { quoted: m });
    }
  }
};
