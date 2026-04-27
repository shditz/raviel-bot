const { getUserRPG, updateUserRPG, updateInventory } = require("../database/rpg_db");
const { checkCooldown, setCooldown, randomChance, addExp, checkAchievements } = require("../utils/rpg_core");

const GRIND_DATA = {
  mine: {
    name: "Mining",
    expRange: [15, 30],
    drops: [
      { id: "stone", prob: 0.7, qtyRange: [1, 5] },
      { id: "iron_ore", prob: 0.3, qtyRange: [1, 2] },
      { id: "gold_ore", prob: 0.05, qtyRange: [1, 1] }
    ]
  },
  fish: {
    name: "Fishing",
    expRange: [10, 25],
    drops: [
      { id: "fish", prob: 0.8, qtyRange: [1, 3] },
      { id: "slime_gel", prob: 0.1, qtyRange: [1, 1] } // Trash catch
    ]
  },
  farm: {
    name: "Farming",
    expRange: [10, 20],
    drops: [
      { id: "wheat", prob: 0.9, qtyRange: [2, 6] }
    ]
  },
  wood: {
    name: "Woodcutting",
    expRange: [10, 25],
    drops: [
      { id: "wood", prob: 0.8, qtyRange: [2, 5] },
      { id: "leather", prob: 0.1, qtyRange: [1, 1] }
    ]
  }
};

module.exports = {
  name: "mine",
  aliases: ["fish", "farm", "wood", "chop"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, getUser } = ctx;
    
    let action = cmd === "chop" ? "wood" : cmd;
    
    if (!GRIND_DATA[action]) return;

    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    const cd = checkCooldown(userRPG, action);
    if (cd.onCooldown) {
      return sock.sendMessage(jid, { text: `⏳ Kamu masih kelelahan! Tunggu ${cd.time} lagi untuk ${GRIND_DATA[action].name}.` }, { quoted: m });
    }

    // Set cooldown
    setCooldown(sender, action);

    const grind = GRIND_DATA[action];
    
    // Calculate Exp
    const expGain = Math.floor(Math.random() * (grind.expRange[1] - grind.expRange[0] + 1)) + grind.expRange[0];
    const expResult = addExp(sender, expGain);
    
    // Calculate Drops
    let getDrops = [];
    for (const drop of grind.drops) {
      if (randomChance(drop.prob)) {
        const qty = Math.floor(Math.random() * (drop.qtyRange[1] - drop.qtyRange[0] + 1)) + drop.qtyRange[0];
        updateInventory(sender, drop.id, qty);
        getDrops.push(`${qty}x ${drop.id.replace("_", " ")}`);
      }
    }

    let dropText = getDrops.length > 0 ? getDrops.join(", ") : "Tidak mendapatkan apa-apa :(";

    let text = `⛏️ *${grind.name.toUpperCase()} HASIL* ⛏️
────────────────────
👤 *Player:* ${userRPG.name}
✨ *EXP:* +${expGain}
📦 *Mendapatkan:* ${dropText}`;

    if (expResult.leveledUp) {
      text += `\n\n🎉 *LEVEL UP!* Kamu sekarang Level ${expResult.newLevel}!`;
      checkAchievements(sender); // check if level up unlocked anything
    }

    await sock.sendMessage(jid, { text }, { quoted: m });
  }
};
