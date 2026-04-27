const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { BASE_LEVELS } = require("../utils/rpg_advanced");
const { checkCooldown, setCooldown } = require("../utils/rpg_core");

module.exports = {
  name: "base",
  aliases: ["house", "upgradebase", "home"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    const isGroup = jid.endsWith("@g.us");
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    // Collect passive income
    const now = Date.now();
    const baseLvl = userRPG.base?.level || 0;
    const baseDef = BASE_LEVELS[baseLvl];
    if (baseDef && baseDef.passiveIncome > 0 && userRPG.base.lastIncome) {
      const hoursPassed = Math.floor((now - userRPG.base.lastIncome) / 3600000);
      if (hoursPassed > 0) {
        const income = baseDef.passiveIncome * Math.min(hoursPassed, 24);
        userRPG.money += income;
        userRPG.base.lastIncome = now;
        updateUserRPG(sender, { money: userRPG.money, base: userRPG.base });
      }
    }

    if (cmd === "upgradebase") {
      const nextLvl = baseLvl + 1;
      if (nextLvl >= BASE_LEVELS.length) return sock.sendMessage(jid, { text: `⚠️ Base kamu sudah level maksimum!` }, { quoted: m });

      const cd = checkCooldown(userRPG, "upgradebase");
      if (cd.onCooldown) return sock.sendMessage(jid, { text: `⏳ Upgrade cooldown: ${cd.time}` }, { quoted: m });

      const nextDef = BASE_LEVELS[nextLvl];
      if (userRPG.money < nextDef.cost) return sock.sendMessage(jid, { text: `⚠️ Butuh ${nextDef.cost} Gold untuk upgrade ke ${nextDef.name}! (Punya: ${userRPG.money})` }, { quoted: m });

      userRPG.money -= nextDef.cost;
      userRPG.base.level = nextLvl;
      setCooldown(sender, "upgradebase");
      updateUserRPG(sender, { money: userRPG.money, base: userRPG.base });
      return sock.sendMessage(jid, { text: `🏗️ *BASE UPGRADED!*\n\nBase kamu sekarang: *${nextDef.name}* (Lv.${nextLvl})\n🏪 Storage: +${nextDef.storage}\n💰 Passive Income: ${nextDef.passiveIncome}/jam\n💚 Regen Bonus: +${nextDef.regenBonus}\n🔨 Craft Bonus: +${(nextDef.craftBonus*100).toFixed(0)}%` }, { quoted: m });
    }

    // Show base info
    const nextLvl = baseLvl + 1;
    const nextDef = nextLvl < BASE_LEVELS.length ? BASE_LEVELS[nextLvl] : null;
    let text = `🏠 *BASE / HOUSING* 🏠\n────────────────────\n`;
    text += `🏠 *${baseDef.name}* (Lv.${baseLvl})\n`;
    text += `🏪 Storage: ${baseDef.storage} slot\n`;
    text += `💰 Passive Income: ${baseDef.passiveIncome} Gold/jam\n`;
    text += `💚 Regen Bonus: +${baseDef.regenBonus}\n`;
    text += `🔨 Craft Bonus: +${(baseDef.craftBonus*100).toFixed(0)}%\n`;

    if (nextDef) {
      text += `\n────────────────────\n📈 *NEXT UPGRADE: ${nextDef.name}*\n`;
      text += `💰 Biaya: ${nextDef.cost} Gold\n`;
      text += `🏪 Storage: ${nextDef.storage} | 💰 Income: ${nextDef.passiveIncome}/jam\n`;
      text += `\nGunakan: \`${PREFIX}upgradebase\``;
    } else {
      text += `\n✅ *BASE LEVEL MAKSIMUM!*`;
    }

    if (isGroup && nextDef) {
      return sock.sendMessage(jid, {
        interactiveMessage: { title: text, footer: "Raviel RPG Housing",
          buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "🏠 AKSI BASE", sections: [{ title: "OPSI", rows: [
            { title: `Upgrade ke ${nextDef.name}`, id: `${PREFIX}upgradebase`, description: `Biaya: ${nextDef.cost} Gold` }
          ]}] }) }] }
      }, { quoted: m });
    }
    return sock.sendMessage(jid, { text }, { quoted: m });
  }
};
