const { getUserRPG, updateUserRPG, updateInventory } = require("../database/rpg_db");
const { ITEMS } = require("../utils/rpg_core");

module.exports = {
  name: "shop",
  aliases: ["buy", "sell"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (cmd === "shop") {
      let shopHeader = `🏪 *RPG SHOP* 🏪\n💰 *Uang Kamu:* ${userRPG.money} Gold\n`;
      const isGroup = jid.endsWith("@g.us");

      if (isGroup) {
        const itemKeys = Object.keys(ITEMS);
        let categories = { consumable: "🧪 Consumables", material: "📦 Materials", weapon: "⚔️ Weapons", armor: "🧥 Armors", accessory: "💍 Accessories", egg: "🐾 Pets" };
        
        const sections = Object.keys(categories).map(catId => {
          const catRows = itemKeys.filter(k => ITEMS[k].type === catId).map(k => {
            const item = ITEMS[k];
            return {
              title: item.name,
              id: `${PREFIX}buy ${k} 1`,
              description: `Harga: ${item.price} Gold | ${item.desc}`
            };
          });
          return { title: categories[catId], rows: catRows };
        }).filter(s => s.rows.length > 0);

        return sock.sendMessage(jid, {
          interactiveMessage: {
            title: shopHeader + "Pilih barang yang ingin Anda beli (Klik untuk beli 1x):",
            footer: "Raviel RPG Global Shop",
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                  title: "🛒 BELANJA",
                  sections: sections
                })
              }
            ]
          }
        }, { quoted: m });
      } else {
        let shopText = shopHeader + `\nGunakan: \`${PREFIX}buy <item_id> <jumlah>\`\nGunakan: \`${PREFIX}sell <item_id> <jumlah>\`\n\n📦 *DAFTAR BARANG:*\n────────────────────`;
        const itemKeys = Object.keys(ITEMS);
        let catLists = { consumable: [], material: [], weapon: [], armor: [], accessory: [], egg: [] };
        
        itemKeys.forEach(k => {
          const item = ITEMS[k];
          if (catLists[item.type]) {
            catLists[item.type].push(`- ${k} (${item.name}): 💰 ${item.price}`);
          }
        });

        if (catLists.consumable.length) shopText += `\n🧪 *Consumables:*\n${catLists.consumable.join("\n")}\n`;
        if (catLists.material.length) shopText += `\n📦 *Materials:*\n${catLists.material.join("\n")}\n`;
        if (catLists.weapon.length) shopText += `\n⚔️ *Weapons:*\n${catLists.weapon.join("\n")}\n`;
        if (catLists.armor.length) shopText += `\n🧥 *Armors:*\n${catLists.armor.join("\n")}\n`;
        if (catLists.accessory.length) shopText += `\n💍 *Accessories:*\n${catLists.accessory.join("\n")}\n`;
        if (catLists.egg.length) shopText += `\n🐾 *Pets:*\n${catLists.egg.join("\n")}\n`;

        return sock.sendMessage(jid, { text: shopText }, { quoted: m });
      }
    }

    if (args.length < 1) {
      return sock.sendMessage(jid, { text: `⚠️ Format salah!\nGunakan: \`${PREFIX}${cmd} <item_id> [jumlah]\`` }, { quoted: m });
    }

    const itemId = args[0].toLowerCase();
    const qty = args.length > 1 ? parseInt(args[1]) : 1;

    if (isNaN(qty) || qty <= 0) {
      return sock.sendMessage(jid, { text: `⚠️ Jumlah harus berupa angka positif!` }, { quoted: m });
    }

    const itemDef = ITEMS[itemId];
    if (!itemDef) {
      return sock.sendMessage(jid, { text: `⚠️ Item *${itemId}* tidak ditemukan di toko!` }, { quoted: m });
    }

    if (cmd === "buy") {
      const totalPrice = itemDef.price * qty;
      if (userRPG.money < totalPrice) {
        return sock.sendMessage(jid, { text: `⚠️ Uang kamu tidak cukup!\nHarga: ${totalPrice} Gold\nUangmu: ${userRPG.money} Gold` }, { quoted: m });
      }

      userRPG.money -= totalPrice;
      updateUserRPG(sender, { money: userRPG.money });
      updateInventory(sender, itemId, qty);

      return sock.sendMessage(jid, { text: `✅ Berhasil membeli ${qty}x *${itemDef.name}* seharga ${totalPrice} Gold!` }, { quoted: m });
    }

    if (cmd === "sell") {
      const currentQty = userRPG.inventory[itemId] || 0;
      if (currentQty < qty) {
        return sock.sendMessage(jid, { text: `⚠️ Kamu tidak memiliki ${qty}x *${itemDef.name}* untuk dijual!` }, { quoted: m });
      }

      // Sell price is 50% of buy price
      const sellPrice = Math.floor((itemDef.price / 2) * qty);
      userRPG.money += sellPrice;
      
      updateUserRPG(sender, { money: userRPG.money });
      updateInventory(sender, itemId, -qty);

      return sock.sendMessage(jid, { text: `✅ Berhasil menjual ${qty}x *${itemDef.name}* seharga ${sellPrice} Gold!` }, { quoted: m });
    }
  }
};
