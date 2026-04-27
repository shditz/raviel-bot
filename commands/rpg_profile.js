const { getUserRPG } = require("../database/rpg_db");
const { calcTotalStats, getLevelExp, ITEMS, PETS } = require("../utils/rpg_core");

module.exports = {
  name: "profile",
  aliases: ["level", "exp", "stat", "rank"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, getUser } = ctx;
    
    let target = sender;
    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }

    const gUser = getUser(target) || { name: "Player" };
    const userRPG = getUserRPG(target, gUser.name);
    
    const stats = calcTotalStats(userRPG);
    const reqExp = getLevelExp(userRPG.level);
    const percentExp = Math.floor((userRPG.exp / reqExp) * 10);
    const progressBar = "█".repeat(percentExp) + "▒".repeat(10 - percentExp);
    
    let wpnName = userRPG.equipment.weapon ? ITEMS[userRPG.equipment.weapon]?.name : "None";
    let armName = userRPG.equipment.armor ? ITEMS[userRPG.equipment.armor]?.name : "None";
    let accName = userRPG.equipment.accessory ? ITEMS[userRPG.equipment.accessory]?.name : "None";
    
    let petName = "None";
    if (userRPG.pet.active) {
      const petDef = PETS.find(p => p.id === userRPG.pet.active);
      if (petDef) petName = petDef.name;
    }

    let titleName = userRPG.activeTitle ? `[${userRPG.activeTitle}]` : "[Beginner]";

    const profileText = `📊 *RPG PROFILE* 📊
────────────────────
👤 *Name:* ${userRPG.name} ${titleName}
🎖️ *Level:* ${userRPG.level}
✨ *EXP:* ${userRPG.exp}/${reqExp}
📈 [${progressBar}] ${percentExp * 10}%
💰 *Money:* ${userRPG.money} Gold
────────────────────
❤️ *HP:* ${stats.hp} / ${stats.maxHp}
🔷 *Mana:* ${stats.mana} / ${stats.maxMana}
🗡️ *Attack:* ${stats.atk}
🛡️ *Defense:* ${stats.def}
💨 *Speed:* ${stats.spd}
🍀 *Luck:* ${stats.luck}
🆙 *Stat Points:* ${userRPG.statPoints}
────────────────────
🎒 *EQUIPMENT*
⚔️ *Weapon:* ${wpnName}
🧥 *Armor:* ${armName}
💍 *Accessory:* ${accName}
🐾 *Pet:* ${petName}
────────────────────
🏆 *STATS*
Hunt Count: ${userRPG.stats.huntCount}
Battle Wins: ${userRPG.stats.battleWin}
Items Crafted: ${userRPG.stats.itemCraft}`;

    await sock.sendMessage(jid, { text: profileText }, { quoted: m });
  }
};
