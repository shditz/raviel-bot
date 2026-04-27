const { getUserRPG, updateUserRPG, updateInventory } = require("../database/rpg_db");
const { RECIPES, ITEMS, checkAchievements } = require("../utils/rpg_core");

module.exports = {
  name: "craft",
  aliases: ["recipe", "craftlist"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (cmd === "recipe" || cmd === "craftlist" || args.length < 1) {
      let text = `🛠️ *CRAFTING RECIPES* 🛠️\n────────────────────\n`;
      const isGroup = jid.endsWith("@g.us");

      if (isGroup) {
        const rows = Object.keys(RECIPES).map(result => {
          const itemDef = ITEMS[result];
          const reqs = RECIPES[result];
          let reqText = [];
          for (const reqItem in reqs) {
            reqText.push(`${reqs[reqItem]}x ${ITEMS[reqItem]?.name || reqItem}`);
          }
          return {
            title: itemDef?.name || result,
            id: `${PREFIX}craft ${result}`,
            description: `Bahan: ${reqText.join(", ")}`
          };
        });

        return sock.sendMessage(jid, {
          interactiveMessage: {
            title: text + "Pilih item yang ingin Anda buat dari daftar resep di bawah ini:",
            footer: "Raviel RPG Crafting Station",
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                  title: "🛠️ PILIH RESEP",
                  sections: [
                    { title: "DAFTAR RESEP", rows: rows }
                  ]
                })
              }
            ]
          }
        }, { quoted: m });
      } else {
        for (const result in RECIPES) {
          const itemDef = ITEMS[result];
          const reqs = RECIPES[result];
          let reqText = [];
          for (const reqItem in reqs) {
            reqText.push(`${reqs[reqItem]}x ${ITEMS[reqItem]?.name || reqItem}`);
          }
          text += `🔹 *${itemDef?.name || result}*\n   Butuh: ${reqText.join(", ")}\n`;
        }
        text += `\n────────────────────\nGunakan: \`${PREFIX}craft <nama_item>\` (Contoh: ${PREFIX}craft iron_sword)`;
        return sock.sendMessage(jid, { text }, { quoted: m });
      }
    }

    const targetItem = args[0].toLowerCase();
    
    if (!RECIPES[targetItem]) {
      return sock.sendMessage(jid, { text: `⚠️ Resep untuk *${targetItem}* tidak ditemukan! Cek \`${PREFIX}recipe\`` }, { quoted: m });
    }

    const reqs = RECIPES[targetItem];
    
    // Check if player has all requirements
    let missing = [];
    for (const reqItem in reqs) {
      const needed = reqs[reqItem];
      const has = userRPG.inventory[reqItem] || 0;
      if (has < needed) {
        missing.push(`${needed - has}x ${ITEMS[reqItem]?.name || reqItem}`);
      }
    }

    if (missing.length > 0) {
      return sock.sendMessage(jid, { text: `⚠️ Material kamu tidak cukup!\nKekurangan:\n- ${missing.join("\n- ")}` }, { quoted: m });
    }

    // Consume materials
    for (const reqItem in reqs) {
      updateInventory(sender, reqItem, -reqs[reqItem]);
    }

    // Add crafted item
    updateInventory(sender, targetItem, 1);
    
    userRPG.stats.itemCraft += 1;
    updateUserRPG(sender, { stats: userRPG.stats });
    checkAchievements(sender);

    const itemName = ITEMS[targetItem]?.name || targetItem;
    await sock.sendMessage(jid, { text: `✅ Berhasil membuat 1x *${itemName}*!` }, { quoted: m });
  }
};
