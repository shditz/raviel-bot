const { getUserRPG } = require("../database/rpg_db");
const { STATUS_EFFECTS } = require("../utils/rpg_advanced");

module.exports = {
  name: "effects",
  aliases: ["status", "debuff"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);
    const now = Date.now();
    const buffs = (userRPG.buffs || []).filter(b => b.expire > now);
    const effects = userRPG.statusEffects || [];

    let text = `🛡️ *STATUS EFFECTS* 🛡️\n────────────────────\n`;

    if (buffs.length > 0) {
      text += `\n✨ *BUFF AKTIF:*\n`;
      buffs.forEach(b => {
        const timeLeft = Math.floor((b.expire - now) / 60000);
        const statStr = Object.entries(b.effects || {}).map(([k,v]) => `${k.toUpperCase()}+${v}`).join(", ");
        text += `• ${b.name} (${timeLeft}m) — ${statStr}\n`;
      });
    } else {
      text += `\n✨ *Buff:* Tidak ada\n`;
    }

    if (effects.length > 0) {
      text += `\n☠️ *DEBUFF/EFEK:*\n`;
      effects.forEach(e => {
        const def = STATUS_EFFECTS[e.id];
        if (def) text += `• ${def.name} — ${def.desc}\n`;
      });
    } else {
      text += `\n☠️ *Debuff:* Tidak ada\n`;
    }

    text += `\n────────────────────\n📋 *SEMUA STATUS EFFECT:*\n`;
    for (const eId in STATUS_EFFECTS) {
      const e = STATUS_EFFECTS[eId];
      text += `${e.name} (${e.type}): ${e.desc}\n`;
    }

    return sock.sendMessage(jid, { text }, { quoted: m });
  }
};
