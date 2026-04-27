const { getUserRPG, updateUserRPG, updateInventory } = require("../database/rpg_db");
const { ITEMS, calcTotalStats } = require("../utils/rpg_core");

module.exports = {
  name: "use",
  aliases: ["heal", "potion"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, PREFIX, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (args.length < 1) {
       return sock.sendMessage(jid, { text: `⚠️ Gunakan: \`${PREFIX}use <nama_item>\`\nContoh: \`${PREFIX}use health_potion\`` }, { quoted: m });
    }

    const itemId = args[0].toLowerCase();
    
    if (!ITEMS[itemId] || ITEMS[itemId].type !== "consumable") {
       return sock.sendMessage(jid, { text: `⚠️ Item bukan tipe consumable yang bisa digunakan!` }, { quoted: m });
    }

    if (!userRPG.inventory[itemId] || userRPG.inventory[itemId] < 1) {
       return sock.sendMessage(jid, { text: `⚠️ Kamu tidak memiliki ${ITEMS[itemId].name} di inventory!` }, { quoted: m });
    }

    const item = ITEMS[itemId];
    let stats = calcTotalStats(userRPG);
    
    let effectText = "";

    if (item.healPercent) {
       const healAmt = Math.floor(stats.maxHp * item.healPercent);
       userRPG.hp = Math.min(stats.maxHp, userRPG.hp + healAmt);
       effectText += `Memulihkan ${healAmt} HP (Sekarang: ${userRPG.hp}/${stats.maxHp}). `;
    }

    if (item.healMana) {
       userRPG.mana = Math.min(stats.maxMana, userRPG.mana + item.healMana);
       effectText += `Memulihkan ${item.healMana} Mana. `;
    }

    if (item.healStamina) {
       userRPG.stamina = Math.min(userRPG.maxStamina, userRPG.stamina + item.healStamina);
       effectText += `Memulihkan ${item.healStamina} Stamina. `;
    }

    updateInventory(sender, itemId, -1);
    updateUserRPG(sender, { hp: userRPG.hp, mana: userRPG.mana, stamina: userRPG.stamina });

    return sock.sendMessage(jid, { text: `🧪 Kamu meminum *${item.name}*!\n${effectText}` }, { quoted: m });
  }
};
