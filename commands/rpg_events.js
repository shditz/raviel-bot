const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { WORLD_EVENTS_LIST } = require("../utils/rpg_advanced");
const { WORLD_STATE, updateWorldState, addExp } = require("../utils/rpg_core");

module.exports = {
  name: "event",
  aliases: ["events", "eventinfo"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, PREFIX, getUser } = ctx;
    updateWorldState();

    let text = `🌍 *WORLD EVENTS* 🌍\n────────────────────\n🌦️ *Cuaca:* ${WORLD_STATE.weather}\n`;

    if (WORLD_STATE.event) {
      const evt = WORLD_EVENTS_LIST.find(e => e.id === WORLD_STATE.event);
      if (evt) {
        text += `\n🎉 *EVENT AKTIF!*\n`;
        text += `📛 *${evt.name}*\n`;
        text += `📝 ${evt.desc}\n`;
        text += `⏱️ Durasi: ${Math.floor(evt.duration / 3600000)} jam\n`;
        text += `\n✨ Efek: `;
        if (evt.effect.expMult) text += `EXP x${evt.effect.expMult} `;
        if (evt.effect.moneyMult) text += `Gold x${evt.effect.moneyMult} `;
        if (evt.effect.dropMult) text += `Drop Rate x${evt.effect.dropMult} `;
        if (evt.effect.bossSpawn) text += `Boss muncul di mana-mana! `;
        if (evt.effect.treasureChance) text += `Treasure chance ${evt.effect.treasureChance * 100}% `;
        if (evt.effect.guildWarMult) text += `Guild War points x${evt.effect.guildWarMult} `;
        if (evt.effect.craftDiscount) text += `Material craft berkurang! `;
        if (evt.effect.regenMult) text += `Regen x${evt.effect.regenMult} `;
      }
    } else {
      text += `\n📭 Tidak ada event aktif saat ini.`;
    }

    text += `\n\n────────────────────\n📋 *DAFTAR EVENT YANG MUNGKIN MUNCUL:*\n`;
    WORLD_EVENTS_LIST.forEach(e => {
      text += `• ${e.name}: ${e.desc}\n`;
    });
    text += `\n_Event berubah otomatis setiap 4 jam._`;

    return sock.sendMessage(jid, { text }, { quoted: m });
  }
};
