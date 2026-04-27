const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { ITEMS } = require("../utils/rpg_core");

module.exports = {
  name: "equip",
  aliases: ["unequip", "equiplist"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (cmd === "equiplist" || (cmd === "equip" && args.length === 0)) {
      let wpnName = userRPG.equipment.weapon ? ITEMS[userRPG.equipment.weapon]?.name : "None";
      let armName = userRPG.equipment.armor ? ITEMS[userRPG.equipment.armor]?.name : "None";
      let accName = userRPG.equipment.accessory ? ITEMS[userRPG.equipment.accessory]?.name : "None";

      const text = `🛡️ *EQUIPMENT KAMU* 🛡️\n────────────────────\n⚔️ *Weapon:* ${wpnName}\n🧥 *Armor:* ${armName}\n💍 *Accessory:* ${accName}\n────────────────────\n`;
      
      const isGroup = jid.endsWith("@g.us");

      if (isGroup) {
        const inventory = userRPG.inventory;
        const sections = [
          { title: "⚔️ WEAPON", rows: Object.keys(inventory).filter(k => ITEMS[k]?.type === "weapon").map(k => ({ title: ITEMS[k].name, id: `${PREFIX}equip ${k}`, description: `ATK: ${ITEMS[k].stats.atk}` })) },
          { title: "🧥 ARMOR", rows: Object.keys(inventory).filter(k => ITEMS[k]?.type === "armor").map(k => ({ title: ITEMS[k].name, id: `${PREFIX}equip ${k}`, description: `DEF: ${ITEMS[k].stats.def}` })) },
          { title: "💍 ACCESSORY", rows: Object.keys(inventory).filter(k => ITEMS[k]?.type === "accessory").map(k => ({ title: ITEMS[k].name, id: `${PREFIX}equip ${k}`, description: ITEMS[k].desc })) },
          { title: "🚪 UNEQUIP", rows: [
            { title: "Lepas Senjata", id: `${PREFIX}unequip weapon` },
            { title: "Lepas Zirah", id: `${PREFIX}unequip armor` },
            { title: "Lepas Aksesori", id: `${PREFIX}unequip accessory` }
          ]}
        ].filter(s => s.rows.length > 0);

        return sock.sendMessage(jid, {
          interactiveMessage: {
            title: text + "Pilih equipment yang ingin Anda pakai atau lepas:",
            footer: "Raviel RPG Armory",
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                  title: "🛡️ KELOLA EQUIP",
                  sections: sections
                })
              }
            ]
          }
        }, { quoted: m });
      } else {
        let fallback = text + `Gunakan: \`${PREFIX}equip <item_id>\`\nGunakan: \`${PREFIX}unequip <tipe (weapon/armor/accessory)>\``;
        return sock.sendMessage(jid, { text: fallback }, { quoted: m });
      }
    }

    if (args.length < 1) {
      return sock.sendMessage(jid, { text: `⚠️ Format salah!\nGunakan: \`${PREFIX}${cmd} <item_id/tipe>\`` }, { quoted: m });
    }

    const target = args[0].toLowerCase();

    if (cmd === "equip") {
      const itemDef = ITEMS[target];
      if (!itemDef) {
        return sock.sendMessage(jid, { text: `⚠️ Item *${target}* tidak valid!` }, { quoted: m });
      }

      if (!["weapon", "armor", "accessory"].includes(itemDef.type)) {
        return sock.sendMessage(jid, { text: `⚠️ *${itemDef.name}* bukan equipment yang bisa dipakai!` }, { quoted: m });
      }

      if (!(userRPG.inventory[target] > 0)) {
        return sock.sendMessage(jid, { text: `⚠️ Kamu tidak memiliki *${itemDef.name}* di inventory!` }, { quoted: m });
      }

      // Check if slot is taken and return it to inventory
      const currentEquip = userRPG.equipment[itemDef.type];
      
      // We don't necessarily need to move it back to inventory if we just treat equipment slot as an active pointer,
      // but if we do pointer, they still "own" it. Let's assume inventory holds everything, and equipment is just a pointer.
      userRPG.equipment[itemDef.type] = target;
      updateUserRPG(sender, { equipment: userRPG.equipment });

      return sock.sendMessage(jid, { text: `✅ Berhasil memakai *${itemDef.name}* sebagai ${itemDef.type}!` }, { quoted: m });
    }

    if (cmd === "unequip") {
      if (!["weapon", "armor", "accessory"].includes(target)) {
        return sock.sendMessage(jid, { text: `⚠️ Slot tidak valid! Pilih: weapon, armor, accessory.` }, { quoted: m });
      }

      if (!userRPG.equipment[target]) {
        return sock.sendMessage(jid, { text: `⚠️ Kamu tidak sedang memakai apapun di slot ${target}!` }, { quoted: m });
      }

      const itemId = userRPG.equipment[target];
      const itemName = ITEMS[itemId]?.name || itemId;
      
      userRPG.equipment[target] = null;
      updateUserRPG(sender, { equipment: userRPG.equipment });

      return sock.sendMessage(jid, { text: `✅ Berhasil melepas *${itemName}* dari slot ${target}!` }, { quoted: m });
    }
  }
};
