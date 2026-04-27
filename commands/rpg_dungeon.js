const { getUserRPG, updateUserRPG, updateInventory } = require("../database/rpg_db");
const { checkCooldown, setCooldown, calcTotalStats, addExp, checkAchievements, generateMonster, calculateDamage, randomChance } = require("../utils/rpg_core");

module.exports = {
  name: "dungeon",
  aliases: ["raid"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    const cd = checkCooldown(userRPG, "dungeon");
    if (cd.onCooldown) {
      return sock.sendMessage(jid, { text: `⏳ Kamu harus beristirahat sebelum memasuki dungeon lagi. Tunggu ${cd.time}.` }, { quoted: m });
    }

    let stats = calcTotalStats(userRPG);
    if (stats.hp < stats.maxHp * 0.5) {
      return sock.sendMessage(jid, { text: `⚠️ HP kamu terlalu rendah untuk memasuki dungeon (Min 50%). Pulihkan diri dulu!` }, { quoted: m });
    }

    setCooldown(sender, "dungeon");

    let battleLog = [`🏰 *DUNGEON RAID (Lv. ${userRPG.level})* 🏰\nKamu memasuki dungeon gelap yang dipenuhi monster...\n`];
    let stages = 3 + Math.floor(Math.random() * 3); // 3 to 5 stages
    
    let totalExp = 0;
    let totalMoney = 0;
    let drops = {};
    let isDead = false;

    for (let i = 1; i <= stages; i++) {
       const monster = generateMonster(userRPG.level + i); // Slightly harder each stage
       
       let pAtk = calculateDamage(stats.atk, monster.def, stats.luck, monster.spd, monster.hp, false);
       let mAtk = calculateDamage(monster.atk, stats.def, 0, stats.spd, stats.maxHp, true);

       // Simplified dungeon combat logic
       const turnsToKill = Math.ceil(monster.hp / (pAtk.damage || 1));
       const damageTaken = turnsToKill * (mAtk.isDodge ? 0 : mAtk.damage);

       stats.hp -= damageTaken;

       if (stats.hp <= 0) {
          isDead = true;
          battleLog.push(`💀 Stage ${i}: Kamu dikalahkan oleh *${monster.name}*!`);
          break;
       }

       battleLog.push(`✅ Stage ${i}: Mengalahkan *${monster.name}* (Sisa HP: ${stats.hp}/${stats.maxHp})`);
       totalExp += monster.exp * 2; // Dungeon bonus
       totalMoney += monster.money * 2;
       
       if (randomChance(monster.dropRate, stats.luck)) {
          drops[monster.drop] = (drops[monster.drop] || 0) + 1;
       }
    }

    if (isDead) {
       const penalty = Math.floor(userRPG.money * 0.1); // 10% penalty
       userRPG.money = Math.max(0, userRPG.money - penalty);
       updateUserRPG(sender, { hp: 1, money: userRPG.money });
       
       battleLog.push(`\n🩸 *RAID GAGAL!*\nKamu terpaksa melarikan diri dan kehilangan ${penalty} Gold. HP tersisa 1.`);
    } else {
       // Add Boss Stage (Dungeon Master)
       battleLog.push(`\n🔥 *DUNGEON MASTER MUNCUL!*`);
       const bossMob = generateMonster(userRPG.level + 5);
       bossMob.name = "Dungeon Elite " + bossMob.name;
       bossMob.hp *= 2;
       bossMob.atk = Math.floor(bossMob.atk * 1.5);
       
       let pAtk = calculateDamage(stats.atk, bossMob.def, stats.luck, bossMob.spd, bossMob.hp, false);
       let mAtk = calculateDamage(bossMob.atk, stats.def, 0, stats.spd, stats.maxHp, true);

       const turnsToKill = Math.ceil(bossMob.hp / (pAtk.damage || 1));
       const damageTaken = turnsToKill * (mAtk.isDodge ? 0 : mAtk.damage);

       stats.hp -= damageTaken;

       if (stats.hp <= 0) {
          const penalty = Math.floor(userRPG.money * 0.1);
          userRPG.money = Math.max(0, userRPG.money - penalty);
          updateUserRPG(sender, { hp: 1, money: userRPG.money });
          battleLog.push(`💀 Kamu dibantai oleh ${bossMob.name}! Kehilangan ${penalty} Gold.`);
       } else {
          totalExp += bossMob.exp * 5;
          totalMoney += bossMob.money * 5;
          drops["wooden_chest"] = 1;
          
          userRPG.money += totalMoney;
          userRPG.stats.dungeonClear += 1;
          
          for (let item in drops) {
             updateInventory(sender, item, drops[item]);
          }

          const expResult = addExp(sender, totalExp);
          updateUserRPG(sender, { hp: stats.hp, money: userRPG.money, stats: userRPG.stats });

          battleLog.push(`🎉 Mengalahkan ${bossMob.name}!\n\n🏅 *RAID CLEARED!*`);
          battleLog.push(`💰 Gold: +${totalMoney}\n✨ EXP: +${totalExp}`);
          
          let dropText = [];
          for (let item in drops) dropText.push(`${drops[item]}x ${item.replace("_", " ")}`);
          battleLog.push(`📦 Loot: ${dropText.join(", ")}`);
          
          if (expResult.leveledUp) {
            battleLog.push(`\n🎊 *LEVEL UP!* Kamu mencapai Level ${expResult.newLevel}!`);
          }
       }
    }

    checkAchievements(sender);
    await sock.sendMessage(jid, { text: battleLog.join("\n") }, { quoted: m });
  }
};
