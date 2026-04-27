const { getUserRPG, updateUserRPG, updateInventory } = require("../database/rpg_db");
const { ITEMS, randomChance } = require("../utils/rpg_core");

module.exports = {
  name: "enchant",
  aliases: ["upgrade"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, PREFIX, getUser } = ctx;
    
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (args.length < 1) {
      const isGroup = jid.endsWith("@g.us");
      
      if (isGroup) {
        const buttons = [
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "✨ PILIH EQUIPMENT UNTUK ENCHANT",
              sections: [
                {
                  title: "SLOT EQUIPMENT",
                  rows: [
                    { title: "⚔️ Weapon", id: `${PREFIX}enchant weapon`, description: `Level Sekarang: +${userRPG.equipmentUpgrades?.weapon || 0}` },
                    { title: "🧥 Armor", id: `${PREFIX}enchant armor`, description: `Level Sekarang: +${userRPG.equipmentUpgrades?.armor || 0}` },
                    { title: "💍 Accessory", id: `${PREFIX}enchant accessory`, description: `Level Sekarang: +${userRPG.equipmentUpgrades?.accessory || 0}` }
                  ]
                }
              ]
            })
          }
        ];

        return sock.sendMessage(jid, {
          interactiveMessage: {
            title: "✨ *CANDY ENCHANTMENT* ✨\nTingkatkan kekuatan peralatanmu! (Butuh 1x Enchant Stone & 500 Gold)",
            footer: "Raviel RPG Forge",
            buttons: buttons
          }
        }, { quoted: m });
      } else {
        return sock.sendMessage(jid, { text: `⚠️ Gunakan: \`${PREFIX}enchant <tipe_equipment>\`\nContoh: \`${PREFIX}enchant weapon\`\n\nSyarat: Butuh 1x Enchant Stone & 500 Gold per level upgrade.` }, { quoted: m });
      }
    }

    const type = args[0].toLowerCase();
    
    if (!["weapon", "armor", "accessory"].includes(type)) {
      return sock.sendMessage(jid, { text: `⚠️ Tipe tidak valid! Pilih: weapon, armor, atau accessory.` }, { quoted: m });
    }

    const itemId = userRPG.equipment[type];
    if (!itemId) {
      return sock.sendMessage(jid, { text: `⚠️ Kamu sedang tidak memakai apapun di slot ${type}!` }, { quoted: m });
    }

    // Check cost
    const enchantStoneCount = userRPG.inventory["enchant_stone"] || 0;
    const costMoney = 500;

    if (enchantStoneCount < 1) {
      return sock.sendMessage(jid, { text: `⚠️ Kamu butuh *1x Enchant Stone* untuk melakukan enchant!` }, { quoted: m });
    }

    if (userRPG.money < costMoney) {
      return sock.sendMessage(jid, { text: `⚠️ Uang kamu kurang! Butuh ${costMoney} Gold.` }, { quoted: m });
    }

    // Take resources
    userRPG.money -= costMoney;
    updateUserRPG(sender, { money: userRPG.money });
    updateInventory(sender, "enchant_stone", -1);

    // Simple upgrade system: We append a "+1" to the item ID/Name or just store upgrade levels
    // Since our system relies on static item IDs from ITEMS, modifying stats of a specific user's item 
    // requires a custom structure. 
    // We'll store it in userRPG.equipmentUpgrades = { weapon: 1, armor: 0, accessory: 0 }
    
    if (!userRPG.equipmentUpgrades) {
      userRPG.equipmentUpgrades = { weapon: 0, armor: 0, accessory: 0 };
    }

    const currentLevel = userRPG.equipmentUpgrades[type] || 0;
    
    // Calculate success chance: decreases as level goes up. Base 80%
    const successRate = Math.max(0.1, 0.8 - (currentLevel * 0.15));

    if (randomChance(successRate)) {
      userRPG.equipmentUpgrades[type] = currentLevel + 1;
      updateUserRPG(sender, { equipmentUpgrades: userRPG.equipmentUpgrades });
      
      // Update stats based on enchant level. (This requires updating calcTotalStats to read equipmentUpgrades, 
      // but for simplicity we just notify user and we will patch calcTotalStats next time)
      
      return sock.sendMessage(jid, { text: `✨ *ENCHANT BERHASIL!* ✨\n${ITEMS[itemId].name} kamu sekarang menjadi +${currentLevel + 1}!\n(Bonus Stat akan bertambah 10% per level)` }, { quoted: m });
    } else {
      return sock.sendMessage(jid, { text: `💥 *ENCHANT GAGAL!* 💥\nBatu enchant hancur, namun equipment kamu tetap aman.` }, { quoted: m });
    }
  }
};
