const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { REGIONS } = require("../utils/rpg_advanced");
const { checkCooldown, setCooldown } = require("../utils/rpg_core");

module.exports = {
  name: "map",
  aliases: ["region", "location", "worldmap"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    const isGroup = jid.endsWith("@g.us");
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (cmd === "location") {
      const reg = REGIONS[userRPG.location] || REGIONS.village;
      let text = `📍 *LOKASI SAAT INI* 📍\n────────────────────\n`;
      text += `🌍 *${reg.name}*\n📝 ${reg.desc}\n⚡ Difficulty: ${"⭐".repeat(reg.difficulty)}\n🎖️ Req Level: ${reg.reqLevel}\n`;
      if (reg.monsterIds.length > 0) text += `👹 Monster: ${reg.monsterIds.join(", ")}\n`;
      if (reg.drops.length > 0) text += `📦 Drops: ${reg.drops.join(", ")}\n`;
      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    let text = `🗺️ *WORLD MAP* 🗺️\n────────────────────\n📍 *Lokasi Kamu:* ${REGIONS[userRPG.location]?.name || "Village"}\n\n`;

    const regionList = Object.entries(REGIONS).map(([id, r]) => {
      const unlocked = userRPG.unlockedAreas?.includes(id) || userRPG.level >= r.reqLevel;
      const current = userRPG.location === id ? " 📍" : "";
      const lock = unlocked ? "🟢" : "🔴";
      return { id, ...r, unlocked, current, lock };
    });

    regionList.forEach(r => {
      text += `${r.lock} *${r.name}*${r.current} (Lv.${r.reqLevel}) ${"⭐".repeat(r.difficulty)}\n`;
    });

    text += `\n────────────────────\nGunakan: \`${PREFIX}travel <region_id>\``;

    if (isGroup) {
      const rows = regionList.filter(r => r.unlocked).map(r => ({
        title: `${r.name} ${r.current}`, id: `${PREFIX}travel ${r.id}`,
        description: `Lv.${r.reqLevel} | ${"⭐".repeat(r.difficulty)} | ${r.desc}`
      }));
      return sock.sendMessage(jid, {
        interactiveMessage: {
          title: text, footer: "Raviel RPG World Map",
          buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "🗺️ TRAVEL KE", sections: [{ title: "REGION", rows }] }) }]
        }
      }, { quoted: m });
    }

    return sock.sendMessage(jid, { text }, { quoted: m });
  }
};
