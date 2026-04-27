const { getUserRPG, updateUserRPG, updateInventory } = require("../database/rpg_db");
const { LOOTBOXES, randomChance, ITEMS } = require("../utils/rpg_core");

module.exports = {
  name: "gacha",
  aliases: ["box", "openbox", "lootbox"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (args.length < 1) {
       let text = `🎁 *GACHA / LOOT BOX* 🎁\n────────────────────\nKotak yang kamu miliki:\n`;
       const isGroup = jid.endsWith("@g.us");
       
       let ownedBoxes = [];
       for (const boxId in LOOTBOXES) {
          const qty = userRPG.inventory[boxId] || 0;
          if (qty > 0) {
             ownedBoxes.push({ id: boxId, qty: qty });
          }
       }

       if (ownedBoxes.length === 0) {
         return sock.sendMessage(jid, { text: `⚠️ Kamu tidak memiliki loot box apa pun saat ini.` }, { quoted: m });
       }

       if (isGroup) {
         const rows = ownedBoxes.map(box => {
           return {
             title: `${ITEMS[box.id].name} (x${box.qty})`,
             id: `${PREFIX}openbox ${box.id}`,
             description: ITEMS[box.id].desc
           };
         });

         return sock.sendMessage(jid, {
           interactiveMessage: {
             title: text + "Pilih kotak yang ingin Anda buka:",
             footer: "Raviel RPG Treasury",
             buttons: [
               {
                 name: "single_select",
                 buttonParamsJson: JSON.stringify({
                   title: "🎁 BUKA KOTAK",
                   sections: [
                     { title: "INVENTORY KOTAK", rows: rows }
                   ]
                 })
               }
             ]
           }
         }, { quoted: m });
       } else {
         ownedBoxes.forEach(box => {
           text += `- ${ITEMS[box.id].name} (${box.qty}x)\n`;
         });
         text += `\n────────────────────\nGunakan: \`${PREFIX}openbox <nama_kotak>\``;
         return sock.sendMessage(jid, { text }, { quoted: m });
       }
    }

    const boxId = args[0].toLowerCase();
    if (!LOOTBOXES[boxId]) {
      return sock.sendMessage(jid, { text: `⚠️ Tipe lootbox tidak valid!` }, { quoted: m });
    }

    if (!userRPG.inventory[boxId] || userRPG.inventory[boxId] < 1) {
      return sock.sendMessage(jid, { text: `⚠️ Kamu tidak memiliki ${ITEMS[boxId].name}!` }, { quoted: m });
    }

    // Use box
    updateInventory(sender, boxId, -1);

    // Roll rewards
    const pool = LOOTBOXES[boxId];
    let rewards = [];
    
    for (const drop of pool) {
       // Luck influences drop prob
       if (randomChance(drop.prob, userRPG.luck)) {
          if (drop.type === "money") {
             const amt = Math.floor(Math.random() * (drop.max - drop.min)) + drop.min;
             userRPG.money += amt;
             rewards.push(`${amt} Gold`);
          } else if (drop.type === "item") {
             updateInventory(sender, drop.id, drop.qty);
             rewards.push(`${drop.qty}x ${ITEMS[drop.id].name}`);
          }
       }
    }

    if (rewards.length === 0) {
       // Pity fallback
       userRPG.money += 50;
       rewards.push(`50 Gold (Pity)`);
    }

    updateUserRPG(sender, { money: userRPG.money });

    let text = `🎉 *MEMBUKA ${ITEMS[boxId].name.toUpperCase()}* 🎉\n\nKamu mendapatkan:\n- ${rewards.join("\n- ")}`;
    return sock.sendMessage(jid, { text }, { quoted: m });
  }
};
