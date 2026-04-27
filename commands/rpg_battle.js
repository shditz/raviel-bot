const { getUserRPG, updateUserRPG, updateInventory } = require("../database/rpg_db");
const { checkCooldown, setCooldown, calcTotalStats, addExp, checkAchievements, randomChance, MONSTERS_DB, createScaledMonster, calculateDamage } = require("../utils/rpg_core");

module.exports = {
  name: "battle",
  aliases: ["fight"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, PREFIX, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    const cd = checkCooldown(userRPG, "battle");
    if (cd.onCooldown) {
      return sock.sendMessage(jid, { text: `⏳ Kamu harus memulihkan stamina sebelum bertarung lagi! Tunggu ${cd.time}.` }, { quoted: m });
    }

    let stats = calcTotalStats(userRPG);
    if (stats.hp <= 0) {
      return sock.sendMessage(jid, { text: `☠️ HP kamu habis! Pulihkan diri dulu (\`!use health_potion\`).` }, { quoted: m });
    }

    let targetKey = args[0] ? args[0].toLowerCase() : null;
    let mobTemplate = MONSTERS_DB.find(m => m.id === targetKey);
    
    if (!mobTemplate) {
      const isGroup = jid.endsWith("@g.us");
      const validMobs = MONSTERS_DB.filter(m => userRPG.level >= m.minLevel - 2 && userRPG.level <= m.maxLevel + 10);

      if (isGroup) {
        const rows = validMobs.map(m => {
          return {
            title: `${m.name} (Lv. ${m.minLevel}-${m.maxLevel})`,
            id: `${PREFIX}battle ${m.id}`,
            description: `Tier: ${m.tier.toUpperCase()} | HP: ${m.baseHp}`
          };
        });

        return sock.sendMessage(jid, {
          interactiveMessage: {
            title: "⚔️ *ARENA PERTARUNGAN* ⚔️\nPilih monster yang ingin Anda lawan dari daftar di bawah ini:",
            footer: "Raviel RPG Battle System",
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                  title: "👹 PILIH MONSTER",
                  sections: [
                    { title: "MONSTER TERSEDIA", rows: rows }
                  ]
                })
              }
            ]
          }
        }, { quoted: m });
      } else {
        const avail = validMobs.map(m => m.id).join(", ");
        return sock.sendMessage(jid, { text: `⚔️ Gunakan: \`${PREFIX}battle <id_monster>\`\n\nMonster tersedia untuk levelmu:\n${avail}` }, { quoted: m });
      }
    }

    // Dynamic scaling based on player level for fair fight
    const monster = createScaledMonster(mobTemplate, userRPG.level);

    setCooldown(sender, "battle");

    let battleLog = [];
    let mHp = monster.hp;
    let turn = 1;

    battleLog.push(`⚔️ *BATTLE VS ${monster.name.toUpperCase()} (Lv. ${monster.level})* ⚔️`);
    battleLog.push(`👤 Kamu: ${stats.hp}/${stats.maxHp} HP`);
    battleLog.push(`👹 ${monster.name}: ${mHp}/${monster.maxHp} HP\n`);
    
    while (stats.hp > 0 && mHp > 0 && turn <= 10) { 
      // Player attacks
      const pAtk = calculateDamage(stats.atk, monster.def, stats.luck, monster.spd, monster.hp, false);
      
      let pLog = `💥 Turn ${turn}: Kamu menyerang`;
      if (pAtk.isDodge) {
         pLog += `, tapi ${monster.name} berhasil *MENGHINDAR*!`;
      } else {
         if (pAtk.isCrit) pLog += ` dengan mematikan *(CRITICAL)*`;
         mHp -= pAtk.damage;
         pLog += ` memberikan *${pAtk.damage} DMG*!`;
      }
      battleLog.push(pLog);
      
      if (mHp <= 0) break;

      // Monster attacks
      const mAtk = calculateDamage(monster.atk, stats.def, 0, stats.spd, stats.maxHp, true);
      
      let mLog = `🩸 Turn ${turn}: ${monster.name} membalas`;
      if (mAtk.isDodge) {
         mLog += `, tapi kamu *MENGHINDAR*!`;
      } else {
         stats.hp -= mAtk.damage;
         mLog += ` memberikan *${mAtk.damage} DMG*!`;
      }
      battleLog.push(mLog);

      turn++;
    }

    if (stats.hp <= 0) {
      const penalty = Math.floor(userRPG.money * 0.05);
      userRPG.money = Math.max(0, userRPG.money - penalty);
      updateUserRPG(sender, { hp: 1, money: userRPG.money });
      
      battleLog.push(`\n☠️ *KAMU DIKALAHKAN!*\nKamu kehilangan ${penalty} Gold. (Sisa HP: 1)`);
    } else if (mHp <= 0) {
      userRPG.money += monster.money;
      userRPG.stats.battleWin += 1;
      
      let drops = [];
      if (randomChance(monster.dropRate, stats.luck)) {
        updateInventory(sender, monster.drop, 1);
        drops.push(`1x ${monster.drop.replace("_", " ")}`);
      }
      
      const expResult = addExp(sender, monster.exp);
      updateUserRPG(sender, { hp: stats.hp, money: userRPG.money, stats: userRPG.stats });
      
      battleLog.push(`\n🎉 *KAMU MENANG!*`);
      battleLog.push(`✨ EXP: +${monster.exp} | 💰 Gold: +${monster.money}`);
      if (drops.length > 0) battleLog.push(`📦 Loot: ${drops.join(", ")}`);
      battleLog.push(`❤️ Sisa HP: ${stats.hp}/${stats.maxHp}`);
      
      if (expResult.leveledUp) {
        battleLog.push(`\n🎊 *LEVEL UP!* Kamu sekarang Level ${expResult.newLevel}!`);
      }
      checkAchievements(sender);
    } else {
      updateUserRPG(sender, { hp: stats.hp });
      battleLog.push(`\n⏳ Pertarungan berakhir seri (batas turn tercapai).`);
    }

    await sock.sendMessage(jid, { text: battleLog.join("\n") }, { quoted: m });
  }
};
