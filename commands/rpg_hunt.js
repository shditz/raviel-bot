const { getUserRPG, updateUserRPG, updateInventory } = require("../database/rpg_db");
const { checkCooldown, setCooldown, calcTotalStats, addExp, checkAchievements, randomChance, generateMonster, calculateDamage } = require("../utils/rpg_core");

module.exports = {
  name: "hunt",
  aliases: ["berburu"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    const cd = checkCooldown(userRPG, "hunt");
    if (cd.onCooldown) {
      return sock.sendMessage(jid, { text: `⏳ Kamu sedang kelelahan setelah berburu. Tunggu ${cd.time}.` }, { quoted: m });
    }

    let stats = calcTotalStats(userRPG);
    if (stats.hp <= 0) {
      return sock.sendMessage(jid, { text: `☠️ HP kamu habis! Pulihkan diri dengan meminum potion (\`!use health_potion\`) sebelum berburu.` }, { quoted: m });
    }

    setCooldown(sender, "hunt");

    // Spawn a dynamically scaled monster
    const monster = generateMonster(userRPG.level);

    // Fast simulation (hunt is quick 1-turn auto resolve)
    // Calculate player damage to monster
    const playerAttack = calculateDamage(stats.atk, monster.def, stats.luck, monster.spd, monster.hp, false);
    
    // Calculate monster damage to player
    const monsterAttack = calculateDamage(monster.atk, stats.def, 0, stats.spd, stats.maxHp, true);

    const dmgReceived = monsterAttack.isDodge ? 0 : monsterAttack.damage;
    let newHp = stats.hp - dmgReceived;

    let logText = `🏕️ *HUNTING LOG* 🏕️\n`;
    logText += `Kamu masuk ke area dan dihadang oleh *${monster.name}* (Lv. ${monster.level}) [Tier: ${monster.tier.toUpperCase()}]!\n\n`;

    if (newHp <= 0) {
       // Player Loses (Safety Mechanism)
       newHp = 1;
       const penalty = Math.floor(userRPG.money * 0.05); // 5% flat penalty on hand
       userRPG.money = Math.max(0, userRPG.money - penalty);
       updateUserRPG(sender, { hp: newHp, money: userRPG.money });
       
       logText += `🩸 *KAMU TERLUKA PARAH!*\nSerangan ${monster.name} terlalu kuat (${dmgReceived} DMG).\nKamu pingsan dan kehilangan ${penalty} Gold. HP tersisa 1.\n`;
    } else {
       // Player Wins
       userRPG.money += monster.money;
       userRPG.stats.huntCount += 1;
       
       let dropText = "";
       if (randomChance(monster.dropRate, stats.luck)) {
         updateInventory(sender, monster.drop, 1);
         dropText = `\n📦 *Loot:* 1x ${monster.drop.replace("_", " ")}`;
       }

       const expResult = addExp(sender, monster.exp);
       updateUserRPG(sender, { hp: newHp, money: userRPG.money, stats: userRPG.stats });

       logText += `💥 Kamu menyerang dengan cepat dan mengalahkan monster!\n`;
       if (dmgReceived > 0) logText += `🩸 Kamu terkena damage sebesar ${dmgReceived} HP.\n`;
       else logText += `🍃 Kamu berhasil menghindari serangannya!\n`;

       logText += `\n🏅 *REWARDS*\n`;
       logText += `💰 Gold: +${monster.money}\n`;
       logText += `✨ EXP: +${monster.exp}${dropText}\n`;
       logText += `❤️ HP Tersisa: ${newHp}/${stats.maxHp}\n`;

       if (expResult.leveledUp) {
          logText += `\n🎊 *LEVEL UP!* Kamu mencapai Level ${expResult.newLevel}!`;
       }

       checkAchievements(sender);
    }

    await sock.sendMessage(jid, { text: logText }, { quoted: m });
  }
};
