const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { REGIONS } = require("../utils/rpg_advanced");
const { checkCooldown, setCooldown } = require("../utils/rpg_core");

module.exports = {
  name: "travel",
  aliases: ["go", "unlockarea", "areas"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (cmd === "areas") {
      let text = `🗺️ *AREA LIST* 🗺️\n────────────────────\n📍 *Lokasi:* ${REGIONS[userRPG.location]?.name || "Village"}\n\n`;
      text += `🔓 *Terbuka:*\n`;
      (userRPG.unlockedAreas || []).forEach(a => {
        const r = REGIONS[a];
        if (r) text += `• ${r.name} (Lv.${r.reqLevel})\n`;
      });
      text += `\n🔒 *Terkunci:*\n`;
      Object.keys(REGIONS).forEach(a => {
        if (!(userRPG.unlockedAreas || []).includes(a)) {
          text += `• ${REGIONS[a].name} (Butuh Lv.${REGIONS[a].reqLevel})\n`;
        }
      });
      text += `\n_Gunakan ${PREFIX}go <area_id> atau ${PREFIX}unlockarea <area_id>_`;
      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    if (cmd === "unlockarea") {
      const target = args[0]?.toLowerCase();
      if (!target || !REGIONS[target]) return sock.sendMessage(jid, { text: `⚠️ Area tidak ditemukan! Cek ${PREFIX}map` }, { quoted: m });
      if ((userRPG.unlockedAreas || []).includes(target)) return sock.sendMessage(jid, { text: `⚠️ Area sudah terbuka!` }, { quoted: m });
      if (userRPG.level < REGIONS[target].reqLevel) return sock.sendMessage(jid, { text: `⚠️ Butuh Level ${REGIONS[target].reqLevel}!` }, { quoted: m });

      userRPG.unlockedAreas = userRPG.unlockedAreas || [];
      userRPG.unlockedAreas.push(target);
      // Update codex
      if (userRPG.codex && !userRPG.codex.regions?.includes(target)) {
        userRPG.codex.regions = userRPG.codex.regions || [];
        userRPG.codex.regions.push(target);
      }
      updateUserRPG(sender, { unlockedAreas: userRPG.unlockedAreas, codex: userRPG.codex });
      return sock.sendMessage(jid, { text: `🗺️ Area baru dibuka: *${REGIONS[target].name}*!` }, { quoted: m });
    }

    if (cmd === "travel" || cmd === "go") {
      const target = args[0]?.toLowerCase();
      if (!target || !REGIONS[target]) return sock.sendMessage(jid, { text: `⚠️ Area tidak ditemukan! Gunakan ${PREFIX}map` }, { quoted: m });
      if (!(userRPG.unlockedAreas || []).includes(target)) {
        return sock.sendMessage(jid, { text: `⚠️ Area belum dibuka! Gunakan ${PREFIX}unlockarea ${target}` }, { quoted: m });
      }
      if (userRPG.location === target) return sock.sendMessage(jid, { text: `⚠️ Kamu sudah di sana!` }, { quoted: m });
      if (userRPG.stamina < 10) return sock.sendMessage(jid, { text: `⚠️ Stamina tidak cukup! (Butuh 10)` }, { quoted: m });

      const cd = checkCooldown(userRPG, "travel");
      if (cd.onCooldown) return sock.sendMessage(jid, { text: `⏳ Cooldown travel: ${cd.time}` }, { quoted: m });

      userRPG.stamina -= 10;
      userRPG.location = target;
      setCooldown(sender, "travel");
      updateUserRPG(sender, { stamina: userRPG.stamina, location: target });

      const reg = REGIONS[target];
      let text = `🚶‍♂️ *TRAVEL*\n────────────────────\nKamu tiba di *${reg.name}*!\n📝 ${reg.desc}\n⚡ Difficulty: ${"⭐".repeat(reg.difficulty)}`;
      if (reg.monsterIds.length > 0) text += `\n👹 Monster: ${reg.monsterIds.join(", ")}`;
      return sock.sendMessage(jid, { text }, { quoted: m });
    }
  }
};
