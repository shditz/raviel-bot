const { getUserRPG, updateUserRPG, updateInventory } = require("../database/rpg_db");
const { checkCooldown, setCooldown, calcTotalStats, addExp, BOSSES, calculateDamage } = require("../utils/rpg_core");

module.exports = {
  name: "boss",
  aliases: ["worldboss"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, PREFIX, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    const cd = checkCooldown(userRPG, "boss");
    if (cd.onCooldown) {
      return sock.sendMessage(jid, { text: `⏳ Boss dunia sedang beristirahat. Tunggu ${cd.time}.` }, { quoted: m });
    }

    let targetKey = args[0] ? args[0].toLowerCase() : null;
    let bossTemp = BOSSES[targetKey];

    if (!bossTemp) {
      const avail = Object.keys(BOSSES).join(", ");
      return sock.sendMessage(jid, { text: `⚠️ Gunakan: \`${PREFIX}boss <id_boss>\`\n\nBoss tersedia:\n${avail}` }, { quoted: m });
    }

    let stats = calcTotalStats(userRPG);
    if (stats.hp <= 0) {
      return sock.sendMessage(jid, { text: `☠️ HP kamu habis! Pulihkan diri dulu (\`!use health_potion\`).` }, { quoted: m });
    }

    setCooldown(sender, "boss");

    // Boss Scaling: Scale boss slightly based on player level to prevent easy cheese, but keep base extremely high
    const mult = 1 + (userRPG.level * 0.05);
    const boss = {
       name: bossTemp.name,
       hp: Math.floor(bossTemp.baseHp * mult),
       maxHp: Math.floor(bossTemp.baseHp * mult),
       atk: Math.floor(bossTemp.baseAtk * mult),
       def: Math.floor(bossTemp.baseDef * mult),
       spd: Math.floor(bossTemp.baseAtk * 0.2), // reasonable spd
       drop: bossTemp.drop
    };

    let battleLog = [];
    let bHp = boss.hp;
    let turn = 1;

    battleLog.push(`👹 *WORLD BOSS RAID: ${boss.name.toUpperCase()}* 👹`);
    battleLog.push(`Boss ini memiliki stat mengerikan. Persiapkan dirimu!`);
    battleLog.push(`👤 Kamu: ${stats.hp}/${stats.maxHp} HP`);
    battleLog.push(`☠️ Boss: ${bHp}/${boss.maxHp} HP\n`);
    
    while (stats.hp > 0 && bHp > 0 && turn <= 15) { 
      // Player
      const pAtk = calculateDamage(stats.atk, boss.def, stats.luck, boss.spd, boss.hp, false);
      let pLog = `💥 T${turn}: Kamu menyerang`;
      if (pAtk.isDodge) {
         pLog += `, tapi Boss *MENGHINDAR*!`;
      } else {
         if (pAtk.isCrit) pLog += ` *(CRIT!)*`;
         bHp -= pAtk.damage;
         pLog += ` (${pAtk.damage} DMG)`;
      }
      battleLog.push(pLog);
      
      if (bHp <= 0) break;

      // Boss Mechanics
      let isHeavy = turn % 3 === 0;
      let isRage = bHp < boss.maxHp * 0.3;
      
      let effectiveAtk = isHeavy ? boss.atk * 1.5 : boss.atk;
      if (isRage) effectiveAtk *= 1.2;

      // Notice for bypass safety: Bosses CAN deal more than 40% HP.
      // But we calculate it without the 40% cap because calculateDamage applies cap only if true. We'll pass false for boss.
      const bAtk = calculateDamage(effectiveAtk, stats.def, 0, stats.spd, stats.maxHp, false); // No safety cap for boss
      
      let bLog = `🩸 T${turn}: ${boss.name}`;
      if (isHeavy) bLog += ` menggunakan *HEAVY ATTACK*`;
      if (isRage) bLog += ` *(RAGE MODE)*`;

      if (bAtk.isDodge) {
         bLog += `, tapi kamu *MENGHINDAR*!`;
      } else {
         stats.hp -= bAtk.damage;
         bLog += ` -> *${bAtk.damage} DMG*!`;
      }
      battleLog.push(bLog);

      turn++;
    }

    if (stats.hp <= 0) {
      const penalty = Math.floor(userRPG.money * 0.1); // 10%
      userRPG.money = Math.max(0, userRPG.money - penalty);
      updateUserRPG(sender, { hp: 1, money: userRPG.money });
      
      battleLog.push(`\n💀 *KAMU TERBUNUH OLEH BOSS!*\nKekuatan ${boss.name} terlalu besar. Kamu kehilangan ${penalty} Gold. (HP: 1)`);
    } else if (bHp <= 0) {
      const rewardExp = 50000 + (userRPG.level * 1000);
      const rewardMoney = 10000 + (userRPG.level * 500);
      
      userRPG.money += rewardMoney;
      updateInventory(sender, boss.drop, 1);
      updateInventory(sender, "golden_chest", 2);
      
      const expResult = addExp(sender, rewardExp);
      updateUserRPG(sender, { hp: stats.hp, money: userRPG.money });
      
      battleLog.push(`\n🎉 *BOSS DEFEATED!*`);
      battleLog.push(`Kemenangan Epik! Dunia merayakan kepahlawananmu.`);
      battleLog.push(`💰 Gold: +${rewardMoney} | ✨ EXP: +${rewardExp}`);
      battleLog.push(`📦 Loot: 1x ${boss.drop.replace("_", " ")}, 2x Golden Chest`);
      
      if (expResult.leveledUp) {
        battleLog.push(`🎊 *LEVEL UP!* Kamu mencapai Level ${expResult.newLevel}!`);
      }
    } else {
      updateUserRPG(sender, { hp: stats.hp });
      battleLog.push(`\n⏳ Waktu habis. ${boss.name} pergi meninggalkan pertarungan. Coba lagi nanti!`);
    }

    await sock.sendMessage(jid, { text: battleLog.join("\n") }, { quoted: m });
  }
};
