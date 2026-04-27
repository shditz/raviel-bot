const { getUserRPG } = require("../database/rpg_db");
const { ITEMS } = require("../utils/rpg_core");

module.exports = {
  name: "inv",
  aliases: ["inventory", "item"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, getUser } = ctx;
    
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);
    
    const inventory = userRPG.inventory;
    const itemKeys = Object.keys(inventory);

    if (itemKeys.length === 0) {
      return sock.sendMessage(jid, { text: "🎒 Tas kamu kosong!" }, { quoted: m });
    }

    let materialList = [];
    let consumableList = [];
    let equipList = [];
    let otherList = [];

    for (const key of itemKeys) {
      const qty = inventory[key];
      const itemDef = ITEMS[key];
      if (!itemDef) {
        otherList.push(`- Unknown Item (${key}): ${qty}x`);
        continue;
      }
      
      const line = `- ${itemDef.name}: ${qty}x`;
      if (itemDef.type === "material") materialList.push(line);
      else if (itemDef.type === "consumable") consumableList.push(line);
      else if (["weapon", "armor", "accessory"].includes(itemDef.type)) equipList.push(line);
      else otherList.push(line);
    }

    let text = `🎒 *INVENTORY KAMU* 🎒\n────────────────────\n`;
    
    if (consumableList.length > 0) {
      text += `🧪 *Consumables:*\n${consumableList.join("\n")}\n\n`;
    }
    if (materialList.length > 0) {
      text += `📦 *Materials:*\n${materialList.join("\n")}\n\n`;
    }
    if (equipList.length > 0) {
      text += `⚔️ *Equipment:*\n${equipList.join("\n")}\n\n`;
    }
    if (otherList.length > 0) {
      text += `🔹 *Lainnya:*\n${otherList.join("\n")}\n\n`;
    }

    text += `────────────────────\n_Gunakan !equip untuk memakai equipment_\n_Gunakan !craft untuk membuat item_`;

    await sock.sendMessage(jid, { text: text.trim() }, { quoted: m });
  }
};
